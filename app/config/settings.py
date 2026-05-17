from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+mysqlconnector://root:root@localhost:3306/cashsight"
    DATABASE_NAME: str = "cashsight"
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str = "root"
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 3306
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_TITLE: str = "Cashsight API"
    DEBUG: bool = True
    
    # Files
    UPLOAD_DIR: str = "./uploads"
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()