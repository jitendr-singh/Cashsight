from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.config.database import Base

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Goal Details
    title = Column(String(255), nullable=False)
    # Example: "New Laptop", "Emergency Fund", "Vacation"
    
    target_amount = Column(Float, nullable=False)
    # Kitna save karna hai?
    # Example: 50000.0
    
    saved_amount = Column(Float, default=0.0)
    # Abhi tak kitna save kiya?
    # Example: 15000.0
    
    monthly_contribution = Column(Float, default=0.0)
    # Har mahine kitna save karoge?
    # Example: 5000.0
    
    deadline = Column(DateTime, nullable=True)
    # Kab tak complete karna hai?
    
    icon = Column(String(10), default="🎯")
    # Goal ka icon
    # Example: "💻", "🏠", "✈️", "🚗"
    
    is_completed = Column(Boolean, default=False)
    # Goal complete ho gayi?
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="savings_goals")
    contributions = relationship("SavingsContribution", back_populates="goal", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SavingsGoal(id={self.id}, title={self.title}, target={self.target_amount})>"