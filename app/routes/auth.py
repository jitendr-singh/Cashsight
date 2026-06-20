from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, TokenResponse, UserResponse, UserUpdate, PasswordChange
from app.utils.security import (
    verify_password, get_password_hash,
    create_access_token, verify_token
)

# 🚨 FIXED: Prefix ko poori tarah hata diya hai taaki routing exact wahi ho jo frontend dhoondh rha h
router = APIRouter(tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = verify_token(token)
    if token_data is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == token_data.user_id).first()

    if user is None:
        raise credentials_exception

    return user


@router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password)
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Explicitly conversion to string for standard JWT claim validation
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(new_user)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again later."
        )


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


# 🚨 EXACT STANDARD ROUTE PATH FOR FRONTEND MATCH:
@router.get("/users/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/users/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update display name and email for logged-in user."""
    if update_data.name is not None and update_data.name.strip():
        current_user.name = update_data.name.strip()
    if update_data.email is not None:
        # Ensure email is not already taken by another user
        existing = db.query(User).filter(
            User.email == update_data.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email address is already in use."
            )
        current_user.email = update_data.email
    try:
        db.commit()
        db.refresh(current_user)
        return UserResponse.model_validate(current_user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile. Please try again."
        )
@router.post("/users/me/password")
async def change_password(
    pwd_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change password for logged-in user. Requires current password verification."""
    if not verify_password(pwd_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
    current_user.password_hash = get_password_hash(pwd_data.new_password)
    try:
        db.commit()
        return {"message": "Password changed successfully."}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password. Please try again."
        )