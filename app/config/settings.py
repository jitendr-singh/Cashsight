from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: Optional[str] = None
    DATABASE_NAME: str = "capitallens"
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 3306
    
    # JWT
    SECRET_KEY: str
    GEMINI_API_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_TITLE: str = "Capitallens API"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    EMERGENCY_FUND_MINIMUM: float = 15000.0
    
    # Files
    UPLOAD_DIR: str = "./uploads"
    LOG_LEVEL: str = "INFO"
    
    @model_validator(mode="after")
    def assemble_db_url(self) -> "Settings":
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"mysql+mysqlconnector://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}"
                f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
            )
        return self
        
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()