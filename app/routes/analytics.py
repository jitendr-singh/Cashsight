from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from datetime import datetime, timedelta, date
from typing import List, Optional
import calendar

from app.config.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.savings import SavingsGoal
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter(tags=["Analytics"])


# ─── OVERALL SUMMARY ─────────────────────────────────────────────────────────

@router.get("/analytics/summary")
async def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    # Start of this month
    this_month_start = datetime(now.year, now.month, 1)
    
    # Start of last month
    if now.month == 1:
        last_month_start = datetime(now.year - 1, 12, 1)
        last_month_end = datetime(now.year, 1, 1) - timedelta(seconds=1)
    else:
        last_month_start = datetime(now.year, now.month - 1, 1)
        last_month_end = this_month_start - timedelta(seconds=1)

    # 1. Overall / Cumulative Metrics (All-time totals)
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income
    ).scalar() or 0.0

    total_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense
    ).scalar() or 0.0

    total_savings = round(total_income - total_expense, 2)

    # 2. This Month Metrics
    this_month_inc = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income,
        Transaction.date >= this_month_start
    ).scalar() or 0.0

    this_month_exp = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
        Transaction.date >= this_month_start
    ).scalar() or 0.0

    this_month_sav = this_month_inc - this_month_exp
    this_month_savings_rate = round((this_month_sav / this_month_inc * 100), 2) if this_month_inc > 0 else 0.0

    # 3. Last Month Metrics
    last_month_inc = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income,
        Transaction.date >= last_month_start,
        Transaction.date <= last_month_end
    ).scalar() or 0.0

    last_month_exp = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
        Transaction.date >= last_month_start,
        Transaction.date <= last_month_end
    ).scalar() or 0.0

    last_month_sav = last_month_inc - last_month_exp
    last_month_savings_rate = round((last_month_sav / last_month_inc * 100), 2) if last_month_inc > 0 else 0.0

    # Calculate average monthly expense (burn rate) fallback for runway
    first_txn_date = db.query(func.min(Transaction.date)).filter(
        Transaction.user_id == current_user.id
    ).scalar()
    if first_txn_date:
        months_diff = (now.year - first_txn_date.year) * 12 + (now.month - first_txn_date.month) + 1
        avg_monthly_exp = total_expense / max(months_diff, 1)
    else:
        avg_monthly_exp = 0.0

    # 4. Runway Calculations
    # Current Runway = Total Savings so far / Current Month's Burn Rate (Expense)
    if this_month_exp > 0:
        current_runway = round(total_savings / this_month_exp, 1)
    elif last_month_exp > 0:
        current_runway = round(total_savings / last_month_exp, 1)
    elif avg_monthly_exp > 0:
        current_runway = round(total_savings / avg_monthly_exp, 1)
    else:
        current_runway = 99.0 if total_savings > 0 else 0.0
    
    # Last Month Runway = Savings up to last month / Last Month's Burn Rate (Expense)
    savings_up_to_last_month = total_savings - this_month_sav
    if last_month_exp > 0:
        last_month_runway = round(savings_up_to_last_month / last_month_exp, 1)
    elif avg_monthly_exp > 0:
        last_month_runway = round(savings_up_to_last_month / avg_monthly_exp, 1)
    else:
        last_month_runway = 99.0 if savings_up_to_last_month > 0 else 0.0

    # 5. Trend Calculations
    # Income Trend (% Change)
    if last_month_inc > 0:
        income_trend = round(((this_month_inc - last_month_inc) / last_month_inc * 100), 2)
    else:
        income_trend = 0.0

    # Burn Rate Trend (% Change)
    if last_month_exp > 0:
        burn_rate_trend = round(((this_month_exp - last_month_exp) / last_month_exp * 100), 2)
    else:
        burn_rate_trend = 0.0

    # Savings Rate Trend (Absolute Difference)
    savings_rate_trend = round(this_month_savings_rate - last_month_savings_rate, 2)

    # Runway Trend (Absolute Difference in months)
    runway_trend = round(current_runway - last_month_runway, 1)

    # 6. Savings Goals lock & Available cash breakout
    locked_savings = db.query(func.sum(SavingsGoal.saved_amount)).filter(
        SavingsGoal.user_id == current_user.id
    ).scalar() or 0.0

    available_cash = total_savings - locked_savings

    return {
        "total_income": round(total_income, 2),
        "monthly_income": round(this_month_inc, 2),
        "income_trend": income_trend,
        "total_expense": round(total_expense, 2),
        "total_savings": round(total_savings, 2),
        "locked_savings": round(locked_savings, 2),
        "available_cash": round(available_cash, 2),
        "savings_rate": this_month_savings_rate,
        "savings_rate_trend": savings_rate_trend,
        "burn_rate": round(this_month_exp, 2),
        "burn_rate_trend": burn_rate_trend,
        "runway_months": current_runway,
        "runway_trend": runway_trend
    }



# ─── SPENDING BY CATEGORY ─────────────────────────────────────────────────────

@router.get("/analytics/by-category")
async def get_by_category(
    scope: Optional[str] = Query("month", description="Data scope: 'month' (current month) or 'all' (all-time)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    this_month_start = datetime(now.year, now.month, 1)

    # Build date filter based on scope
    date_filters_exp = [
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
    ]
    date_filters_inc = [
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income,
    ]

    if scope == "month":
        date_filters_exp.append(Transaction.date >= this_month_start)
        date_filters_inc.append(Transaction.date >= this_month_start)

    # Expenses by category
    expense_by_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).filter(*date_filters_exp).group_by(Transaction.category).all()

    # Income by category
    income_by_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).filter(*date_filters_inc).group_by(Transaction.category).all()

    return {
        "scope": scope,
        "expense_by_category": [
            {"category": row.category, "amount": row.total}
            for row in expense_by_category
        ],
        "income_by_category": [
            {"category": row.category, "amount": row.total}
            for row in income_by_category
        ]
    }


# ─── MONTHLY TREND ────────────────────────────────────────────────────────────

@router.get("/analytics/monthly-trend")
async def get_monthly_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Last 6 months data
    six_months_ago = datetime.utcnow() - timedelta(days=180)

    monthly_data = db.query(
        extract('year', Transaction.date).label('year'),
        extract('month', Transaction.date).label('month'),
        Transaction.type,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= six_months_ago
    ).group_by('year', 'month', Transaction.type).all()

    # Format data
    months = {}
    for row in monthly_data:
        key = f"{int(row.year)}-{int(row.month):02d}"
        if key not in months:
            months[key] = {"month": key, "income": 0, "expense": 0}
        if row.type == TransactionType.income:
            months[key]["income"] = row.total
        else:
            months[key]["expense"] = row.total

    trend = sorted(months.values(), key=lambda x: x["month"])

    return {"monthly_trend": trend}


# ─── RECENT TRANSACTIONS ──────────────────────────────────────────────────────

@router.get("/analytics/recent")
async def get_recent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recent = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).limit(5).all()

    return {
        "recent_transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "category": t.category,
                "description": t.description,
                "date": t.date.strftime("%b %d, %Y")
            }
            for t in recent
        ]
    }


# ─── RANGE ANALYTICS (Day / Month / Year / Custom) ───────────────────────────

@router.get("/analytics/range")
async def get_range_data(
    view_mode: str = Query(..., description="day | month | year | custom"),

    # Day mode params
    year: Optional[int] = Query(None, description="Year (used in day/month mode)"),
    month: Optional[int] = Query(None, description="Month 1-12 (used in day mode)"),
    from_day: Optional[int] = Query(None, description="Start day 1-31"),
    to_day: Optional[int] = Query(None, description="End day 1-31"),

    # Month mode params
    from_month: Optional[int] = Query(None, description="Start month 1-12"),
    to_month: Optional[int] = Query(None, description="End month 1-12"),

    # Year mode params
    from_year: Optional[int] = Query(None, description="Start year e.g. 2020"),
    to_year: Optional[int] = Query(None, description="End year e.g. 2025"),

    # Custom mode params
    start_date: Optional[date] = Query(None, description="Custom start date YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="Custom end date YYYY-MM-DD"),

    # Add-on filters
    category: Optional[str] = Query(None, description="Filter by category name"),
    txn_type: Optional[str] = Query(None, description="income | expense | both"),
    min_amount: Optional[float] = Query(None, description="Minimum transaction amount"),
    max_amount: Optional[float] = Query(None, description="Maximum transaction amount"),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Flexible analytics endpoint supporting 4 view modes.
    Now optimized to perform a single aggregate query and Python-side grouping.
    """
    # 1. Determine period start and end datetimes, and pre-populate intervals
    interval_data = {}

    if view_mode == "day":
        if not year or not month:
            raise HTTPException(status_code=400, detail="year and month are required for day mode")
        
        _from = from_day or 1
        _to = to_day or 31
        
        # Determine actual last day of the month using calendar
        _, last_day = calendar.monthrange(year, month)
        _to = min(_to, last_day)

        period_start = datetime(year, month, _from, 0, 0, 0)
        period_end = datetime(year, month, _to, 23, 59, 59)

        for day_num in range(_from, _to + 1):
            interval_data[day_num] = {"income": 0.0, "expense": 0.0}

    elif view_mode == "month":
        if not year:
            raise HTTPException(status_code=400, detail="year is required for month mode")
        
        _from_m = from_month or 1
        _to_m = to_month or 12

        period_start = datetime(year, _from_m, 1, 0, 0, 0)
        if _to_m == 12:
            period_end = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            period_end = datetime(year, _to_m + 1, 1) - timedelta(seconds=1)

        for m in range(_from_m, _to_m + 1):
            interval_data[m] = {"income": 0.0, "expense": 0.0}

    elif view_mode == "year":
        _from_y = from_year or 2020
        _to_y = to_year or datetime.utcnow().year

        period_start = datetime(_from_y, 1, 1, 0, 0, 0)
        period_end = datetime(_to_y, 12, 31, 23, 59, 59)

        for y in range(_from_y, _to_y + 1):
            interval_data[y] = {"income": 0.0, "expense": 0.0}

    elif view_mode == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="start_date and end_date are required for custom mode")
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be before end_date")

        period_start = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
        period_end = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59)

        days_diff = (end_date - start_date).days

        # Determine granularity: daily, monthly, yearly
        if days_diff <= 45:
            # Daily aggregation (dictionary key: date object)
            current_day = start_date
            while current_day <= end_date:
                interval_data[current_day] = {"income": 0.0, "expense": 0.0}
                current_day += timedelta(days=1)
        elif days_diff <= 365:
            # Monthly aggregation (dictionary key: (year, month) tuple)
            curr_y, curr_m = start_date.year, start_date.month
            end_y, end_m = end_date.year, end_date.month
            while (curr_y < end_y) or (curr_y == end_y and curr_m <= end_m):
                interval_data[(curr_y, curr_m)] = {"income": 0.0, "expense": 0.0}
                if curr_m == 12:
                    curr_y += 1
                    curr_m = 1
                else:
                    curr_m += 1
        else:
            # Yearly aggregation (dictionary key: year integer)
            for yr in range(start_date.year, end_date.year + 1):
                interval_data[yr] = {"income": 0.0, "expense": 0.0}

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid view_mode. Must be: day | month | year | custom"
        )

    # 2. Build filters for single database query
    query_filters = [
        Transaction.user_id == current_user.id,
        Transaction.date >= period_start,
        Transaction.date <= period_end
    ]

    # Optional category filter
    if category and category.lower() != "all":
        query_filters.append(Transaction.category == category)

    # Optional transaction type filter
    if txn_type and txn_type.lower() in ("income", "expense"):
        mapped = TransactionType.income if txn_type.lower() == "income" else TransactionType.expense
        query_filters.append(Transaction.type == mapped)

    # Optional amount filters
    if min_amount is not None:
        query_filters.append(Transaction.amount >= min_amount)
    if max_amount is not None:
        query_filters.append(Transaction.amount <= max_amount)

    # 3. Query all matching transactions (single round-trip)
    txns = db.query(
        Transaction.date,
        Transaction.type,
        Transaction.amount
    ).filter(*query_filters).all()

    # 4. Aggregate transaction data Python-side
    for t in txns:
        t_type = t.type.value if hasattr(t.type, "value") else str(t.type)
        if t_type not in ("income", "expense"):
            continue

        if view_mode == "day":
            day_num = t.date.day
            if day_num in interval_data:
                interval_data[day_num][t_type] += t.amount

        elif view_mode == "month":
            month_num = t.date.month
            if month_num in interval_data:
                interval_data[month_num][t_type] += t.amount

        elif view_mode == "year":
            year_num = t.date.year
            if year_num in interval_data:
                interval_data[year_num][t_type] += t.amount

        elif view_mode == "custom":
            days_diff = (end_date - start_date).days
            if days_diff <= 45:
                # Daily
                t_date = t.date.date()
                if t_date in interval_data:
                    interval_data[t_date][t_type] += t.amount
            elif days_diff <= 365:
                # Monthly
                t_month_key = (t.date.year, t.date.month)
                if t_month_key in interval_data:
                    interval_data[t_month_key][t_type] += t.amount
            else:
                # Yearly
                t_year = t.date.year
                if t_year in interval_data:
                    interval_data[t_year][t_type] += t.amount

    # 5. Format results into output arrays
    labels = []
    income_data = []
    expense_data = []
    savings_data = []

    if view_mode == "day":
        for day_num in sorted(interval_data.keys()):
            labels.append(str(day_num))
            inc = round(interval_data[day_num]["income"], 2)
            exp = round(interval_data[day_num]["expense"], 2)
            income_data.append(inc)
            expense_data.append(exp)
            savings_data.append(round(inc - exp, 2))

    elif view_mode == "month":
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        for m in sorted(interval_data.keys()):
            labels.append(month_names[m - 1])
            inc = round(interval_data[m]["income"], 2)
            exp = round(interval_data[m]["expense"], 2)
            income_data.append(inc)
            expense_data.append(exp)
            savings_data.append(round(inc - exp, 2))

    elif view_mode == "year":
        for y in sorted(interval_data.keys()):
            labels.append(str(y))
            inc = round(interval_data[y]["income"], 2)
            exp = round(interval_data[y]["expense"], 2)
            income_data.append(inc)
            expense_data.append(exp)
            savings_data.append(round(inc - exp, 2))

    elif view_mode == "custom":
        days_diff = (end_date - start_date).days
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        if days_diff <= 45:
            # Daily
            for d_date in sorted(interval_data.keys()):
                labels.append(d_date.strftime("%d %b"))
                inc = round(interval_data[d_date]["income"], 2)
                exp = round(interval_data[d_date]["expense"], 2)
                income_data.append(inc)
                expense_data.append(exp)
                savings_data.append(round(inc - exp, 2))
        elif days_diff <= 365:
            # Monthly
            for t_month_key in sorted(interval_data.keys()):
                yr, m = t_month_key
                labels.append(f"{month_names[m - 1]} {str(yr)[2:]}")
                inc = round(interval_data[t_month_key]["income"], 2)
                exp = round(interval_data[t_month_key]["expense"], 2)
                income_data.append(inc)
                expense_data.append(exp)
                savings_data.append(round(inc - exp, 2))
        else:
            # Yearly
            for yr in sorted(interval_data.keys()):
                labels.append(str(yr))
                inc = round(interval_data[yr]["income"], 2)
                exp = round(interval_data[yr]["expense"], 2)
                income_data.append(inc)
                expense_data.append(exp)
                savings_data.append(round(inc - exp, 2))

    # Period-level summary totals
    total_income = round(sum(income_data), 2)
    total_expense = round(sum(expense_data), 2)
    total_savings = round(total_income - total_expense, 2)
    savings_rate = round((total_savings / total_income * 100), 2) if total_income > 0 else 0.0

    return {
        "view_mode": view_mode,
        "labels": labels,
        "income": income_data,
        "expense": expense_data,
        "savings": savings_data,
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "total_savings": total_savings,
            "savings_rate": savings_rate
        }
    }


# ─── AVAILABLE CATEGORIES (for filter dropdown) ───────────────────────────────

@router.get("/analytics/categories")
async def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all unique categories for the current user (for filter dropdowns)."""
    rows = db.query(Transaction.category).filter(
        Transaction.user_id == current_user.id
    ).distinct().all()

    categories = sorted([row.category for row in rows if row.category])
    return {"categories": categories}