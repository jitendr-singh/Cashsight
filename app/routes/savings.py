from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.config.database import get_db
from app.models.savings import SavingsGoal
from app.models.savings_contribution import SavingsContribution
from app.models.user import User
from app.schemas.savings import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse
)
from app.routes.auth import get_current_user

router = APIRouter(tags=["Savings"])


# ─── HELPER: Calculate Progress ──────────────────────────────────────────────

def calculate_progress(goal: SavingsGoal) -> dict:
    """
    Goal ki progress calculate karo
    """
    # Progress percentage
    progress = (goal.saved_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
    progress = min(progress, 100)  # Max 100%

    # Months remaining
    months_remaining = None
    if goal.deadline:
        now = datetime.utcnow()
        if goal.deadline > now:
            years_diff = goal.deadline.year - now.year
            months_diff = goal.deadline.month - now.month
            total_months = years_diff * 12 + months_diff
            if goal.deadline.day < now.day:
                total_months -= 1
            months_remaining = max(0, total_months)

    # Amount remaining
    amount_remaining = max(0, goal.target_amount - goal.saved_amount)

    return {
        "progress_percentage": round(progress, 1),
        "months_remaining": months_remaining,
        "amount_remaining": amount_remaining
    }


# ─── CREATE SAVINGS GOAL ─────────────────────────────────────────────────────

@router.post("/savings", response_model=SavingsGoalResponse)
async def create_savings_goal(
    goal_data: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Nayi savings goal banao
    Example: "New Laptop" - Target: ₹50,000 - Monthly: ₹5,000
    """
    new_goal = SavingsGoal(
        user_id=current_user.id,
        title=goal_data.title,
        target_amount=goal_data.target_amount,
        saved_amount=goal_data.saved_amount or 0.0,
        monthly_contribution=goal_data.monthly_contribution or 0.0,
        deadline=goal_data.deadline,
        icon=goal_data.icon or "🎯"
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    # Initial deposit check
    if new_goal.saved_amount > 0:
        initial_log = SavingsContribution(
            goal_id=new_goal.id,
            amount=new_goal.saved_amount
        )
        db.add(initial_log)
        db.commit()

    # Progress calculate karo
    progress = calculate_progress(new_goal)
    
    response = SavingsGoalResponse.model_validate(new_goal)
    response.progress_percentage = progress["progress_percentage"]
    response.months_remaining = progress["months_remaining"]

    return response


# ─── GET ALL SAVINGS GOALS ───────────────────────────────────────────────────

@router.get("/savings", response_model=List[SavingsGoalResponse])
async def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    User ki saari savings goals lo
    """
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id
    ).order_by(SavingsGoal.created_at.desc()).all()

    result = []
    for goal in goals:
        progress = calculate_progress(goal)
        response = SavingsGoalResponse.model_validate(goal)
        response.progress_percentage = progress["progress_percentage"]
        response.months_remaining = progress["months_remaining"]
        result.append(response)

    return result


# ─── GET SINGLE SAVINGS GOAL ─────────────────────────────────────────────────

@router.get("/savings/{goal_id}", response_model=SavingsGoalResponse)
async def get_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    progress = calculate_progress(goal)
    response = SavingsGoalResponse.model_validate(goal)
    response.progress_percentage = progress["progress_percentage"]
    response.months_remaining = progress["months_remaining"]

    return response


# ─── ADD MONEY TO GOAL ───────────────────────────────────────────────────────

@router.post("/savings/{goal_id}/add-money")
async def add_money_to_goal(
    goal_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Goal mein paisa add karo
    Example: ₹5,000 add kiya is month
    """
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deposit amount must be greater than zero."
        )

    # Calculate actual added amount (cannot exceed target amount cap)
    actual_added = amount
    if goal.saved_amount + amount >= goal.target_amount:
        actual_added = max(0.0, goal.target_amount - goal.saved_amount)
        goal.saved_amount = goal.target_amount
        goal.is_completed = True
    else:
        goal.saved_amount += amount

    if actual_added > 0:
        contribution = SavingsContribution(
            goal_id=goal.id,
            amount=actual_added
        )
        db.add(contribution)

    db.commit()
    db.refresh(goal)

    progress = calculate_progress(goal)

    return {
        "message": f"₹{actual_added} added successfully!",
        "goal_title": goal.title,
        "saved_amount": goal.saved_amount,
        "target_amount": goal.target_amount,
        "progress_percentage": progress["progress_percentage"],
        "is_completed": goal.is_completed
    }


# ─── WITHDRAW MONEY FROM GOAL ──────────────────────────────────────────────────

@router.post("/savings/{goal_id}/withdraw")
async def withdraw_money_from_goal(
    goal_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Goal mein se paisa nikalo / adjust karo
    """
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Withdrawal amount must be greater than zero."
        )

    # Calculate actual withdrawable (cap at what is currently saved)
    actual_withdrawn = min(amount, goal.saved_amount)
    if actual_withdrawn <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No funds available to withdraw or invalid amount"
        )

    goal.saved_amount -= actual_withdrawn
    goal.is_completed = False  # Mark as active since balance dropped

    # Log as negative contribution
    contribution = SavingsContribution(
        goal_id=goal.id,
        amount=-actual_withdrawn
    )
    db.add(contribution)
    db.commit()
    db.refresh(goal)

    progress = calculate_progress(goal)

    return {
        "message": f"₹{actual_withdrawn} withdrawn successfully!",
        "goal_title": goal.title,
        "saved_amount": goal.saved_amount,
        "target_amount": goal.target_amount,
        "progress_percentage": progress["progress_percentage"],
        "is_completed": goal.is_completed
    }


# ─── UPDATE SAVINGS GOAL ─────────────────────────────────────────────────────

@router.put("/savings/{goal_id}", response_model=SavingsGoalResponse)
async def update_savings_goal(
    goal_id: int,
    goal_data: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    update_data = goal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)

    progress = calculate_progress(goal)
    response = SavingsGoalResponse.model_validate(goal)
    response.progress_percentage = progress["progress_percentage"]
    response.months_remaining = progress["months_remaining"]

    return response


# ─── DELETE SAVINGS GOAL ─────────────────────────────────────────────────────

@router.delete("/savings/{goal_id}")
async def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    db.delete(goal)
    db.commit()

    return {"message": f"Goal '{goal.title}' deleted successfully!"}


# ─── SAVINGS SUMMARY ─────────────────────────────────────────────────────────

@router.get("/savings-summary/all")
async def get_savings_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saari savings goals ka summary
    """
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id
    ).all()

    total_target = sum(g.target_amount for g in goals)
    total_saved = sum(g.saved_amount for g in goals)
    completed_goals = sum(1 for g in goals if g.is_completed)
    active_goals = sum(1 for g in goals if not g.is_completed)

    overall_progress = (total_saved / total_target * 100) if total_target > 0 else 0

    return {
        "total_goals": len(goals),
        "completed_goals": completed_goals,
        "active_goals": active_goals,
        "total_target_amount": total_target,
        "total_saved_amount": total_saved,
        "overall_progress": round(overall_progress, 1)
    }


# ─── ALL CONTRIBUTIONS LOGS ──────────────────────────────────────────────────

@router.get("/savings/contributions/all")
async def get_all_contributions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    User ke saare goals ki contributions history lo
    """
    contributions = db.query(SavingsContribution).join(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id
    ).order_by(SavingsContribution.created_at.desc()).limit(30).all()

    return [
        {
            "id": c.id,
            "goal_id": c.goal_id,
            "goal_title": c.goal.title,
            "amount": c.amount,
            "created_at": c.created_at.strftime("%b %d, %Y %H:%M")
        }
        for c in contributions
    ]