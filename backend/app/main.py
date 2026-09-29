from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine

from app.routes.auth import router as auth_router


app = FastAPI(
    title="MaliFlow API",
    description="Personal financial management platform",
    version="0.1.0",
)
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to MaliFlow API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }