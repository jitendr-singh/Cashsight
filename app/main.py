from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config.settings import settings
from app.config.database import engine, Base
from app.routes import auth
# from app.routes import transactions
from app.routes.transaction import router as transactions_router
from app.routes.analytics import router as analytics_router
from app.routes.savings import router as savings_router
from app.routes.investment import router as investment_router
from app.routes.chat import router as chat_router

# Setup logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Capitallens API")
    yield
    logger.info("🛑 Shutting down Capitallens API")

app = FastAPI(
    title=settings.API_TITLE,
    version="1.0.0",
    lifespan=lifespan
)

origins = [orig.strip() for orig in settings.CORS_ORIGINS.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(savings_router, prefix="/api/v1")
app.include_router(investment_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Capitallens API",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Capitallens live ",
        "docs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )