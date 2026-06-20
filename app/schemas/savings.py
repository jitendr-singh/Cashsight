from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SavingsGoalCreate(BaseModel):
    title: str
    target_amount: float = Field(gt=0, description="Target amount must be greater than zero")
    saved_amount: Optional[float] = Field(0.0, ge=0, description="Saved amount cannot be negative")
    monthly_contribution: Optional[float] = Field(0.0, ge=0, description="Monthly contribution cannot be negative")
    deadline: Optional[datetime] = None
    icon: Optional[str] = "🎯"

class SavingsGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0, description="Target amount must be greater than zero")
    saved_amount: Optional[float] = Field(None, ge=0, description="Saved amount cannot be negative")
    monthly_contribution: Optional[float] = Field(None, ge=0, description="Monthly contribution cannot be negative")
    deadline: Optional[datetime] = None
    icon: Optional[str] = None
    is_completed: Optional[bool] = None

class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    target_amount: float
    saved_amount: float
    monthly_contribution: float
    deadline: Optional[datetime]
    icon: str
    is_completed: bool
    progress_percentage: Optional[float] = None
    months_remaining: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True