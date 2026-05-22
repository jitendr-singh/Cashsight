from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from app.config.settings import settings

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData(BaseModel):
    """Token payload data model"""
    user_id: int


def get_password_hash(password: str) -> str:
    """
    Hash a plain text password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify that a plain password matches a hashed password
    
    Args:
        plain_password: Plain text password from user
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token for user authentication
    
    Args:
        data: Dictionary with user data (must include "sub" = user_id)
        expires_delta: Token expiration time (default: 30 minutes)
        
    Returns:
        Encoded JWT token string
    """
    # Create a copy of the data to encode
    to_encode = data.copy()
    
    # Set token expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default: 30 minutes
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Add expiration time to token payload
    to_encode.update({"exp": expire})
    
    # Encode the token using JWT
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> TokenData | None:
    """
    Verify and decode a JWT access token
    
    Args:
        token: JWT token string
        
    Returns:
        TokenData with user_id if valid, None if invalid
    """
    try:
        # Decode the JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Extract user_id from token
        user_id: int = payload.get("sub")
        
        # If no user_id in token, return None
        if user_id is None:
            return None
        
        # Return TokenData with user_id
        return TokenData(user_id=user_id)
        
    except JWTError:
        # If token is invalid (expired, malformed, etc.), return None
        return None