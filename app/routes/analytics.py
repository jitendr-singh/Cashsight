from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import List

from app.config.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter(tags=["Analytics"])


# ─── OVERALL SUMMARY ─────────────────────────────────────────────────────────

@router.get("/analytics/summary")
async def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total Income
    total_income = db.query(
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income
    ).scalar() or 0.0

    # Total Expense
    total_expense = db.query(
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense
    ).scalar() or 0.0

    # Savings
    total_savings = total_income - total_expense
    savings_rate = round((total_savings / total_income * 100), 2) if total_income > 0 else 0.0
    burn_rate = total_expense
    runway = round((total_savings / burn_rate), 1) if burn_rate > 0 else 0.0

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_savings": total_savings,
        "savings_rate": savings_rate,
        "burn_rate": burn_rate,
        "runway_months": runway
    }


# ─── SPENDING BY CATEGORY ─────────────────────────────────────────────────────

@router.get("/analytics/by-category")
async def get_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Expenses by category
    expense_by_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense
    ).group_by(Transaction.category).all()

    # Income by category
    income_by_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income
    ).group_by(Transaction.category).all()

    return {
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