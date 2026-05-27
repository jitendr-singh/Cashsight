from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category: str
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[TransactionType] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: TransactionType
    category: str
    description: Optional[str]
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionSummary(BaseModel):
    total_income: float
    total_expense: float
    total_savings: float
    savings_rate: float
    transaction_count: int