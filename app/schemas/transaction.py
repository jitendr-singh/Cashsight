from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class TransactionCreate(BaseModel):
    amount: float = Field(gt=0, description="Amount must be positive")
    type: TransactionType
    category: str
    description: Optional[str] = None
    date: Optional[datetime] = None

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None:
            now = datetime.now(v.tzinfo) if v.tzinfo is not None else datetime.utcnow()
            if v > now:
                raise ValueError("Transaction date cannot be in the future")
        return v

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0, description="Amount must be positive")
    type: Optional[TransactionType] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None:
            now = datetime.now(v.tzinfo) if v.tzinfo is not None else datetime.utcnow()
            if v > now:
                raise ValueError("Transaction date cannot be in the future")
        return v

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