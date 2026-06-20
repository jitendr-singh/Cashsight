from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import math
import os
import tempfile
import logging

from app.config.settings import settings
from app.config.database import get_db
from app.models.investment import Investment, InvestmentStatus
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.investment import (
    InvestmentCreate,
    InvestmentUpdate,
    InvestmentResponse,
    PortfolioSummary
)
from app.routes.auth import get_current_user
from app.services.ai import generate_investment_suggestions
from app.services.market_data import calculate_live_investment_value
from app.services.cas_parser import parse_cas_pdf

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Investments"])

def calculate_investment_value(inv: Investment) -> float:
    """
    Calculates the current value of an investment.
    
    - Stocks / Mutual Funds / Gold: uses REAL live market prices via yfinance / AMFI API.
      Falls back to formula-based growth if ticker not found or API unreachable.
    - Fixed Deposit: compound interest formula (quarterly compounding)
    - Real Estate: annual appreciation compounding
    - Govt Schemes (PPF/NPS): annual compounding at stated rate
    """
    if inv.status == InvestmentStatus.redeemed:
        return inv.current_value

    elapsed_days = (datetime.utcnow() - inv.created_at).days
    elapsed_days = max(1, elapsed_days)
    years = elapsed_days / 365.0

    # ── Market-linked assets: try REAL live prices first ────────────────────
    if inv.asset_type in ["stocks", "mutual_funds", "gold"]:
        live_result = calculate_live_investment_value(
            asset_type=inv.asset_type,
            asset_name=inv.asset_name,
            quantity=inv.quantity,
            buy_price=inv.buy_price,
            amount_invested=inv.amount_invested
        )
        
        if live_result["is_live"] and live_result["current_value"]:
            logger.info(
                f"Live price for {inv.asset_name}: ₹{live_result['current_price']} "
                f"| Portfolio value: ₹{live_result['current_value']} "
                f"| Change: {live_result['change_pct']}%"
            )
            return live_result["current_value"]
        
        # ── Fallback: formula-based CAGR estimation (if API fails / ticker not found) ──
        logger.warning(f"Live price unavailable for {inv.asset_name}, using CAGR fallback.")
        cagr_map = {"stocks": 0.15, "mutual_funds": 0.13, "gold": 0.09}
        base_cagr = cagr_map.get(inv.asset_type, 0.12)
        return round(inv.amount_invested * math.pow(1 + base_cagr, years), 2)

    # ── Fixed Deposit: Quarterly Compounding ─────────────────────────────────
    elif inv.asset_type == "fixed_deposit":
        p = inv.amount_invested
        r = (inv.interest_rate or 0.0) / 100.0
        if inv.maturity_date and datetime.utcnow() >= inv.maturity_date:
            maturity_years = (inv.maturity_date - inv.created_at).days / 365.0
            return round(p * math.pow(1 + r/4, 4 * maturity_years), 2)
        return round(p * math.pow(1 + r/4, 4 * years), 2)

    # ── Real Estate: Annual Appreciation ─────────────────────────────────────
    elif inv.asset_type == "real_estate":
        p = inv.amount_invested
        r = (inv.appreciation_rate or 0.0) / 100.0
        return round(p * math.pow(1 + r, years), 2)

    # ── Govt Schemes (PPF/NPS): Annual Compounding ───────────────────────────
    elif inv.asset_type == "govt_schemes":
        p = inv.amount_invested
        r = (inv.interest_rate or 0.0) / 100.0
        return round(p * math.pow(1 + r, years), 2)

    return inv.current_value


# ─── GET PORTFOLIO SUMMARY ──────────────────────────────────────────────────

@router.get("/investments/portfolio", response_model=PortfolioSummary)
async def get_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.active
    ).all()

    total_invested = 0.0
    current_value = 0.0
    total_monthly_rent = 0.0

    updated_investments = []
    for inv in investments:
        # Update dynamically calculated values
        calc_val = calculate_investment_value(inv)
        inv.current_value = calc_val
        
        total_invested += inv.amount_invested
        current_value += calc_val
        
        if inv.asset_type == "real_estate" and inv.rental_income:
            total_monthly_rent += inv.rental_income
            
        updated_investments.append(inv)

    total_profit_loss = current_value - total_invested
    profit_loss_percentage = (total_profit_loss / total_invested * 100) if total_invested > 0 else 0.0

    return {
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "total_profit_loss": round(total_profit_loss, 2),
        "profit_loss_percentage": round(profit_loss_percentage, 2),
        "total_monthly_rent": round(total_monthly_rent, 2),
        "investments": updated_investments
    }


# ─── GET AI RECOMMENDATIONS ─────────────────────────────────────────────────

# ─── GET AI RECOMMENDATIONS ─────────────────────────────────────────────────

@router.get("/investments/suggestions")
async def get_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch user financial profile
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income
    ).scalar() or 0.0

    total_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense
    ).scalar() or 0.0

    total_savings = total_income - total_expense
    savings_rate = (total_savings / total_income * 100) if total_income > 0 else 0.0

    # Calculate available cash (exclude locked active investments)
    active_investment_sum = db.query(func.sum(Investment.amount_invested)).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.active
    ).scalar() or 0.0

    # 1. Income stability detection (Salaried vs Freelance)
    # Query income transactions in the last 6 months to check regular monthly income
    now = datetime.utcnow()
    six_months_ago = now - timedelta(days=180)
    income_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income,
        Transaction.date >= six_months_ago
    ).all()
    
    # Check frequency of income transactions
    months_with_income = set()
    for tx in income_txs:
        months_with_income.add(tx.date.strftime("%Y-%m"))
    
    if len(months_with_income) >= 2 or (total_income == 0):
        income_stability = "Salaried"
        stability_points = 30
    else:
        income_stability = "Freelance"
        stability_points = 10

    # Calculate average monthly expense (burn rate) for runway/emergency calculations
    first_txn_date = db.query(func.min(Transaction.date)).filter(
        Transaction.user_id == current_user.id
    ).scalar()
    
    if first_txn_date:
        months_diff = (now.year - first_txn_date.year) * 12 + (now.month - first_txn_date.month) + 1
        avg_monthly_exp = total_expense / max(months_diff, 1)
    else:
        avg_monthly_exp = 0.0

    this_month_start = datetime(now.year, now.month, 1)
    this_month_exp = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
        Transaction.date >= this_month_start
    ).scalar() or 0.0
    
    monthly_expense = this_month_exp if this_month_exp > 0 else avg_monthly_exp
    if monthly_expense <= 0:
        monthly_expense = total_expense if total_expense > 0 else 0.0

    # Determine Emergency Fund Target
    from app.models.savings import SavingsGoal
    emergency_goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id,
        SavingsGoal.title.ilike("%emergency%")
    ).all()
    if emergency_goals:
        emergency_target = sum(g.target_amount for g in emergency_goals)
        total_emergency_saved = sum(g.saved_amount for g in emergency_goals)
        emergency_gap = max(0.0, emergency_target - total_emergency_saved)
    else:
        # Default: 3 months of expenses (safety first, minimum from settings)
        emergency_target = max(settings.EMERGENCY_FUND_MINIMUM, monthly_expense * 3)
        emergency_gap = max(0.0, emergency_target - total_savings)

    # Calculate runway months
    runway_months = round(total_savings / monthly_expense, 1) if monthly_expense > 0 else (99.0 if total_savings > 0 else 0.0)
    runway_months = max(0.0, runway_months)

    # 2. Risk Score calculation (0-100)
    risk_score = 0
    risk_score += stability_points
    
    # Savings Rate points
    if savings_rate > 50:
        risk_score += 25
    elif savings_rate >= 20:
        risk_score += 15
    else:
        risk_score += 5
        
    # Runway points (since target is now 3 months, >3 months gives +25, 1.5-3m gives +15, <1.5m gives 0)
    if runway_months > 3:
        risk_score += 25
    elif runway_months >= 1.5:
        risk_score += 15
    else:
        risk_score += 0
        
    # Existing Investments points
    active_investments_count = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.active
    ).count()
    
    if active_investments_count > 0:
        risk_score += 20
    else:
        risk_score += 10
        
    # Risk Profile assignment
    if risk_score <= 30:
        risk_profile = "Conservative"
    elif risk_score <= 60:
        risk_profile = "Moderate"
    else:
        risk_profile = "Aggressive"

    # 3. Capping investable surplus based on runway safety thresholds
    unallocated_cash = max(0.0, total_savings - active_investment_sum)
    warning_message = None
    
    if runway_months < 1.5:
        # Critical warning & tight cap: 15% of savings, max 20,000
        safe_cap = max(0.0, min(total_savings * 0.15, 20000.0))
        safe_cap = round(safe_cap / 100.0) * 100.0
        available_cash = min(unallocated_cash, safe_cap)
        
        warning_message = (
            f"Build your Emergency Fund first! Your financial runway is only {runway_months:.1f} months "
            f"(target 3 months: ₹{emergency_target:,.0f}). For safety, we capped your investable surplus "
            f"to ₹{available_cash:,.0f}."
        )
    elif total_savings < emergency_target:
        # Partial warning & moderate cap: total savings minus half of emergency target
        safe_cap = max(0.0, total_savings - (emergency_target / 2))
        safe_cap = round(safe_cap / 100.0) * 100.0
        available_cash = min(unallocated_cash, safe_cap)
        
        warning_message = (
            f"Your Emergency Fund is incomplete. Target is ₹{emergency_target:,.0f}, currently at ₹{total_savings:,.0f}. "
            f"For safety, we capped your investable surplus to ₹{available_cash:,.0f}."
        )
    else:
        available_cash = unallocated_cash

    # 4. Diversification & Concentration Checks
    active_investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.active
    ).all()
    
    total_portfolio_value = sum(inv.amount_invested for inv in active_investments)
    portfolio_distribution = {}
    for inv in active_investments:
        portfolio_distribution[inv.asset_type] = portfolio_distribution.get(inv.asset_type, 0.0) + inv.amount_invested
        
    portfolio_warnings = []
    has_equity = False
    has_debt = False
    has_gold = False
    
    if total_portfolio_value > 0:
        for asset_type, amount in portfolio_distribution.items():
            pct = (amount / total_portfolio_value) * 100
            if pct > 40:
                portfolio_warnings.append(
                    f"Single asset class '{asset_type.replace('_', ' ').title()}' occupies {pct:.0f}% of your portfolio (ideal cap: 40%). "
                    "Consider allocating new investments to other categories."
                )
            if asset_type in ["stocks", "mutual_funds"]:
                has_equity = True
            if asset_type in ["fixed_deposit", "govt_schemes"]:
                has_debt = True
            if asset_type == "gold":
                has_gold = True
                
        if not has_equity:
            portfolio_warnings.append("No equity exposure detected. Consider starting with a low-cost Index Mutual Fund.")
        if not has_debt:
            portfolio_warnings.append("No stable debt/fixed-income instruments (FD/PPF) found. Consider adding some to balance your portfolio.")
        if not has_gold:
            portfolio_warnings.append("No gold allocation found. Consider adding gold (up to 10%) as a hedge against inflation.")
    else:
        portfolio_warnings.append("No active investments tracked yet. We recommend starting with small, safe allocations.")

    # Call Gemini AI Suggester with full profile context
    suggestions = generate_investment_suggestions(
        available_cash=available_cash,
        savings_rate=savings_rate,
        total_income=total_income,
        total_expense=total_expense,
        total_savings=total_savings,
        runway_months=runway_months,
        risk_score=risk_score,
        risk_profile=risk_profile,
        emergency_target=emergency_target,
        emergency_gap=emergency_gap,
        portfolio_warnings=portfolio_warnings
    )
    return {
        "available_cash": round(available_cash, 2),
        "savings_rate": round(savings_rate, 2),
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "total_savings": round(total_savings, 2),
        "emergency_fund_status": "Safe" if (runway_months >= 3.0 and total_savings >= emergency_target) else "Building",
        "risk_score": risk_score,
        "risk_profile": risk_profile,
        "runway_months": runway_months,
        "emergency_fund_target": round(emergency_target, 2),
        "emergency_gap": round(emergency_gap, 2),
        "warning_message": warning_message,
        "portfolio_warnings": portfolio_warnings,
        "suggestions": suggestions
    }



# ─── EXECUTE INVESTMENT ─────────────────────────────────────────────────────

@router.post("/investments", response_model=InvestmentResponse)
async def create_investment(
    inv_data: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Add Investment record directly
    # (Users track existing investments — no balance gate needed)
    new_inv = Investment(
        user_id=current_user.id,
        asset_name=inv_data.asset_name,
        asset_type=inv_data.asset_type.value,
        amount_invested=inv_data.amount_invested,
        current_value=inv_data.current_value or inv_data.amount_invested,
        quantity=inv_data.quantity,
        buy_price=inv_data.buy_price,
        interest_rate=inv_data.interest_rate,
        maturity_date=inv_data.maturity_date,
        annual_contribution=inv_data.annual_contribution,
        rental_income=inv_data.rental_income,
        appreciation_rate=inv_data.appreciation_rate,
        status=InvestmentStatus.active
    )
    db.add(new_inv)

    # 2. Log matching expense transaction (portfolio tracking)
    expense_desc = f"Invested in {new_inv.asset_name} ({new_inv.asset_type.replace('_', ' ').title()})"
    txn = Transaction(
        user_id=current_user.id,
        amount=new_inv.amount_invested,
        type=TransactionType.expense,
        category="Investment",
        description=expense_desc,
        date=datetime.utcnow()
    )
    db.add(txn)

    # 3. If user has no income at all, auto-create a balancing income entry
    #    so portfolio math (savings rate, available cash) stays positive
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income
    ).scalar() or 0.0

    if total_income == 0:
        balance_txn = Transaction(
            user_id=current_user.id,
            amount=new_inv.amount_invested,
            type=TransactionType.income,
            category="Portfolio Capital",
            description=f"Initial capital for {new_inv.asset_name} investment tracking",
            date=datetime.utcnow()
        )
        db.add(balance_txn)

    try:
        db.commit()
        db.refresh(new_inv)
        return new_inv
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record investment: {str(e)}"
        )


# ─── REDEEM INVESTMENT ──────────────────────────────────────────────────────

@router.post("/investments/{investment_id}/redeem")
async def redeem_investment(
    investment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.active
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active investment not found."
        )

    # Calculate final redemption value
    final_value = calculate_investment_value(inv)
    inv.current_value = final_value
    inv.status = InvestmentStatus.redeemed
    inv.updated_at = datetime.utcnow()

    # Calculate accumulated real estate rental returns if applicable
    accumulated_rent = 0.0
    if inv.asset_type == "real_estate" and inv.rental_income:
        elapsed_days = (datetime.utcnow() - inv.created_at).days
        months = max(1, elapsed_days // 30)
        accumulated_rent = inv.rental_income * months

    redemption_total = final_value + accumulated_rent

    # Log matching income transaction
    income_desc = f"Redeemed {inv.asset_name} at valuation of {final_value:.2f} Rs"
    if accumulated_rent > 0:
        income_desc += f" (Includes {accumulated_rent:.2f} Rs accumulated rent)"

    txn = Transaction(
        user_id=current_user.id,
        amount=redemption_total,
        type=TransactionType.income,
        category="Investment Return",
        description=income_desc,
        date=datetime.utcnow()
    )
    db.add(txn)

    try:
        db.commit()
        return {
            "message": "Investment redeemed successfully.",
            "payout": redemption_total,
            "capital_gains": round(final_value - inv.amount_invested, 2),
            "rental_earnings": accumulated_rent
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Redemption failed: {str(e)}"
        )


# ─── UPDATE INVESTMENT ──────────────────────────────────────────────────────

@router.put("/investments/{investment_id}", response_model=InvestmentResponse)
async def update_investment(
    investment_id: int,
    inv_data: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found."
        )

    old_asset_name = inv.asset_name

    update_dict = inv_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(inv, field, value)

    inv.updated_at = datetime.utcnow()

    # Sync ledger transaction if amount or name changed
    if "amount_invested" in update_dict or "asset_name" in update_dict:
        txn = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == TransactionType.expense,
            Transaction.category == "Investment",
            Transaction.description.like(f"%{old_asset_name}%")
        ).first()
        if txn:
            if "amount_invested" in update_dict:
                txn.amount = inv.amount_invested
            if "asset_name" in update_dict or "amount_invested" in update_dict:
                txn.description = f"Invested in {inv.asset_name} ({inv.asset_type.replace('_', ' ').title()})"

    try:
        db.commit()
        db.refresh(inv)
        return inv
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )


# ─── DELETE INVESTMENT ──────────────────────────────────────────────────────

@router.delete("/investments/{investment_id}")
async def delete_investment(
    investment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found."
        )

    # Find corresponding transaction and delete it
    txn = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
        Transaction.category == "Investment",
        Transaction.description.like(f"%{inv.asset_name}%")
    ).first()

    if txn:
        db.delete(txn)

    db.delete(inv)
    try:
        db.commit()
        return {"message": "Investment and associated transaction deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete investment: {str(e)}"
        )


# ─── LIVE PRICE LOOKUP ───────────────────────────────────────────────────────

@router.get("/investments/live-price")
async def get_live_price_endpoint(
    asset_type: str,
    asset_name: str,
    quantity: Optional[float] = None,
    buy_price: Optional[float] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Lookup real-time market price for a given asset.
    
    - stocks: pass ticker like "RELIANCE", "TCS", "INFY"
    - mutual_funds: pass scheme code (e.g. "120503") or fund name
    - gold: asset_name is ignored, returns current gold price/gram
    
    Returns:
        { current_price, current_value, is_live, change_pct, source }
    """
    from app.services.market_data import get_live_price
    
    if asset_type not in ["stocks", "mutual_funds", "gold"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Live prices only available for: stocks, mutual_funds, gold"
        )
    
    result = calculate_live_investment_value(
        asset_type=asset_type,
        asset_name=asset_name,
        quantity=quantity,
        buy_price=buy_price,
        amount_invested=(quantity * buy_price) if (quantity and buy_price) else 0.0
    )
    
    if not result["current_price"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not fetch live price for '{asset_name}'. "
                   f"For stocks, use NSE ticker (e.g. 'RELIANCE'). "
                   f"For MFs, use AMFI scheme code or fund name."
        )
    
    return {
        "asset_type": asset_type,
        "asset_name": asset_name,
        "current_price": result["current_price"],
        "current_value": result["current_value"],
        "is_live": result["is_live"],
        "change_pct": result["change_pct"],
        "source": "Yahoo Finance / AMFI"
    }


# ─── CAS PDF IMPORT ──────────────────────────────────────────────────────────

@router.post("/investments/import-cas")
async def import_cas_statement(
    file: UploadFile = File(..., description="CAS PDF from CAMS/KFintech/NSDL"),
    password: Optional[str] = Form(None, description="PDF password (PAN+DOB for CAMS)"),
    auto_save: bool = Form(False, description="Automatically create investment records from parsed data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import holdings from a Consolidated Account Statement (CAS) PDF.
    
    Supported providers:
    - **CAMS** CAS: https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement
    - **KFintech** CAS: https://mfs.kfintech.com/investor/General/ConsolidatedAccountStatement
    - **NSDL/CDSL** equity statements
    
    Password format (for encrypted CAS): PAN (uppercase) + DOB as ddmmyyyy
    Example: ABCDE1234F01011990
    
    If `auto_save=true`, detected holdings will be automatically saved as investment records.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported. Please upload your CAS statement PDF."
        )
    
    # Save uploaded file to temp location
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded file: {str(e)}"
        )
    
    try:
        # Parse CAS PDF
        parsed = parse_cas_pdf(tmp_path, password=password)
        
        saved_count = 0
        save_errors = []
        
        if auto_save and parsed["total_holdings"] > 0:
            # Auto-create investment records from parsed holdings
            
            # --- Save Mutual Funds ---
            for mf in parsed["mutual_funds"]:
                if not mf["units"] or mf["units"] <= 0:
                    continue
                try:
                    existing = db.query(Investment).filter(
                        Investment.user_id == current_user.id,
                        Investment.asset_name == mf["scheme_name"],
                        Investment.asset_type == "mutual_funds",
                        Investment.status == InvestmentStatus.active
                    ).first()
                    
                    if not existing:
                        inv = Investment(
                            user_id=current_user.id,
                            asset_name=mf["scheme_name"][:255],
                            asset_type="mutual_funds",
                            amount_invested=mf.get("invested_value") or (mf["units"] * (mf["nav"] or 0)),
                            current_value=mf.get("current_value") or (mf["units"] * (mf["nav"] or 0)),
                            quantity=mf["units"],
                            buy_price=mf.get("nav"),
                            status=InvestmentStatus.active
                        )
                        db.add(inv)
                        saved_count += 1
                except Exception as e:
                    save_errors.append(f"MF '{mf.get('scheme_name', 'Unknown')}': {str(e)}")
            
            # --- Save Stocks ---
            for stock in parsed["stocks"]:
                if not stock["quantity"] or stock["quantity"] <= 0:
                    continue
                try:
                    existing = db.query(Investment).filter(
                        Investment.user_id == current_user.id,
                        Investment.asset_name == (stock.get("ticker") or stock["company_name"]),
                        Investment.asset_type == "stocks",
                        Investment.status == InvestmentStatus.active
                    ).first()
                    
                    if not existing:
                        ticker_name = stock.get("ticker") or stock["company_name"]
                        buy_per_share = (stock["buy_value"] / stock["quantity"]) if (stock.get("buy_value") and stock["quantity"]) else 0
                        
                        inv = Investment(
                            user_id=current_user.id,
                            asset_name=ticker_name[:255],
                            asset_type="stocks",
                            amount_invested=stock.get("buy_value") or 0,
                            current_value=stock.get("buy_value") or 0,
                            quantity=float(stock["quantity"]),
                            buy_price=round(buy_per_share, 2),
                            status=InvestmentStatus.active
                        )
                        db.add(inv)
                        saved_count += 1
                except Exception as e:
                    save_errors.append(f"Stock '{stock.get('company_name', 'Unknown')}': {str(e)}")
            
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error while saving holdings: {str(e)}"
                )
        
        return {
            "success": True,
            "source": parsed["source"],
            "total_holdings_found": parsed["total_holdings"],
            "mutual_funds_count": len(parsed["mutual_funds"]),
            "stocks_count": len(parsed["stocks"]),
            "mutual_funds": parsed["mutual_funds"],
            "stocks": parsed["stocks"],
            "auto_saved": saved_count,
            "save_errors": save_errors,
            "message": (
                f"Successfully parsed CAS from {parsed['source']}. "
                f"Found {len(parsed['mutual_funds'])} mutual funds and {len(parsed['stocks'])} stocks. "
                f"{'Auto-saved ' + str(saved_count) + ' new records.' if auto_save else 'Set auto_save=true to save these to your portfolio.'}"
            )
        }
    
    except ValueError as e:
        # Password error or format error
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"CAS import failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse CAS PDF: {str(e)}"
        )
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
