from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AssetType(str, Enum):
    stocks = "stocks"
    fixed_deposit = "fixed_deposit"
    mutual_funds = "mutual_funds"
    gold = "gold"
    govt_schemes = "govt_schemes"
    real_estate = "real_estate"

class InvestmentCreate(BaseModel):
    asset_name: str
    asset_type: AssetType
    amount_invested: float
    current_value: Optional[float] = None
    
    # Specific fields
    quantity: Optional[float] = None
    buy_price: Optional[float] = None
    interest_rate: Optional[float] = None
    maturity_date: Optional[datetime] = None
    annual_contribution: Optional[float] = None
    rental_income: Optional[float] = None
    appreciation_rate: Optional[float] = None

class InvestmentUpdate(BaseModel):
    asset_name: Optional[str] = None
    amount_invested: Optional[float] = None
    current_value: Optional[float] = None
    quantity: Optional[float] = None
    buy_price: Optional[float] = None
    interest_rate: Optional[float] = None
    maturity_date: Optional[datetime] = None
    annual_contribution: Optional[float] = None
    rental_income: Optional[float] = None
    appreciation_rate: Optional[float] = None

class InvestmentResponse(BaseModel):
    id: int
    user_id: int
    asset_name: str
    asset_type: str
    amount_invested: float
    current_value: float
    status: str
    created_at: datetime
    updated_at: datetime
    
    quantity: Optional[float] = None
    buy_price: Optional[float] = None
    interest_rate: Optional[float] = None
    maturity_date: Optional[datetime] = None
    annual_contribution: Optional[float] = None
    rental_income: Optional[float] = None
    appreciation_rate: Optional[float] = None

    class Config:
        from_attributes = True

class PortfolioSummary(BaseModel):
    total_invested: float
    current_value: float
    total_profit_loss: float
    profit_loss_percentage: float
    total_monthly_rent: float
    investments: List[InvestmentResponse]
