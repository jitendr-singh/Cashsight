from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.config.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionSummary
)
from app.routes.auth import get_current_user

router = APIRouter(tags=["Transactions"])


# ─── CREATE TRANSACTION ──────────────────────────────────────────────────────

@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_transaction = Transaction(
        user_id=current_user.id,
        amount=transaction_data.amount,
        type=transaction_data.type,
        category=transaction_data.category,
        description=transaction_data.description,
        date=transaction_data.date or datetime.utcnow()
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction


# ─── GET ALL TRANSACTIONS ────────────────────────────────────────────────────

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    )

    if type:
        query = query.filter(Transaction.type == type)

    if category:
        query = query.filter(Transaction.category == category)

    transactions = query.order_by(
        Transaction.date.desc()
    ).limit(limit).all()

    return transactions


# ─── GET SINGLE TRANSACTION ──────────────────────────────────────────────────

@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    return transaction


# ─── UPDATE TRANSACTION ──────────────────────────────────────────────────────

@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    update_data = transaction_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


# ─── DELETE TRANSACTION ──────────────────────────────────────────────────────

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    db.delete(transaction)
    db.commit()

    return {"message": "Transaction deleted successfully"}


# ─── GET SUMMARY (Income, Expense, Savings) ──────────────────────────────────

@router.get("/transactions/summary/all", response_model=TransactionSummary)
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

    # Calculate Savings
    total_savings = total_income - total_expense

    # Savings Rate
    savings_rate = (total_savings / total_income * 100) if total_income > 0 else 0.0

    # Transaction Count
    transaction_count = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).count()

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_savings": total_savings,
        "savings_rate": round(savings_rate, 2),
        "transaction_count": transaction_count
    }