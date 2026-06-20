from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.config.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.models.investment import Investment, InvestmentStatus
from app.models.savings import SavingsGoal
from app.services.ai_chat import generate_chat_response

router = APIRouter(tags=["AI Chat"])

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    active_tab: str
    chat_history: List[ChatMessage]

@router.post("/ai/chat")
async def chat_with_advisor(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    POST route to chat with context-aware advisor. Automatically collects user's
    real-time financial stats to inject into the Gemini context.
    """
    # 1. Fetch income & expenses
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

    # Calculate average monthly expense (burn rate) for runway calculations
    now = datetime.utcnow()
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
    runway_months = (total_savings / monthly_expense) if monthly_expense > 0 else (99.0 if total_savings > 0 else 0.0)

    # 2. Fetch active investments
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.active
    ).all()
    total_invested = sum(inv.amount_invested for inv in investments)

    # Clean serializable list of active investments
    serialized_investments = [
        {
            "asset_name": inv.asset_name,
            "asset_type": inv.asset_type,
            "amount_invested": float(inv.amount_invested),
            "interest_rate": float(inv.interest_rate) if inv.interest_rate else None,
            "appreciation_rate": float(inv.appreciation_rate) if inv.appreciation_rate else None
        }
        for inv in investments
    ]

    # 3. Fetch savings goals
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id
    ).all()
    
    # Clean serializable list of goals
    serialized_goals = [
        {
            "title": g.title,
            "target_amount": float(g.target_amount),
            "saved_amount": float(g.saved_amount),
            "progress_percentage": round((g.saved_amount / g.target_amount * 100), 1) if g.target_amount > 0 else 0.0
        }
        for g in goals
    ]

    # 4. Fetch transaction logs (up to 120 most recent transactions)
    txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).limit(120).all()

    serialized_txns = [
        {
            "amount": float(t.amount),
            "type": t.type.value if hasattr(t.type, 'value') else str(t.type),
            "category": t.category,
            "description": t.description,
            "date": t.date.strftime("%Y-%m-%d") if t.date else None
        }
        for t in txns
    ]

    # Compile the final data snapshot dictionary
    financial_data = {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_savings": total_savings,
        "savings_rate": savings_rate,
        "runway_months": runway_months,
        "total_invested": total_invested,
        "investments": serialized_investments,
        "goals": serialized_goals,
        "transactions": serialized_txns
    }

    # Format chat history to raw dictionary format
    serialized_history = [
        {"role": msg.role, "content": msg.content}
        for msg in req.chat_history
    ]

    # Get answer from service
    response_text = generate_chat_response(
        query=req.message,
        active_tab=req.active_tab,
        financial_data=financial_data,
        chat_history=serialized_history,
        db=db,
        user_id=current_user.id
    )

    return {
        "response": response_text
    }
