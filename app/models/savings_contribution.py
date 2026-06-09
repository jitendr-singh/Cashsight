from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.config.database import Base

class SavingsContribution(Base):
    __tablename__ = "savings_contributions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("savings_goals.id"), nullable=False)
    
    # Positive for deposits, negative for withdrawals/adjustments
    amount = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    goal = relationship("SavingsGoal", back_populates="contributions")

    def __repr__(self):
        return f"<SavingsContribution(id={self.id}, goal_id={self.goal_id}, amount={self.amount})>"
