from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine
from app.routes.auth import router as auth_router
from app.routes.financial_account import router as financial_account_router
from app.routes.ledger import router as ledger_router
from app.routes.financial_position import router as financial_position_router
from app.routes.income import router as income_router
from app.routes.expenses import router as expenses_router
from app.routes.expense_categories import router as expense_categories_router
from app.routes.budgets import router as budgets_router
from app.routes.savings import router as savings_router
from app.routes.obligations import router as obligations_router
from app.routes.investments import router as investments_router
from app.routes.major_purchase_routes import router as major_purchase_router
from app.routes.financing_agreement_routes import router as financing_agreement_router
from app.routes.major_purchase_payment_routes import router as major_purchase_payment_router







app = FastAPI(
    title="MaliFlow API",
    description="Personal financial management platform",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(financial_account_router)
app.include_router(ledger_router)
app.include_router(financial_position_router)
app.include_router(income_router)
app.include_router(expenses_router)
app.include_router(expense_categories_router)
app.include_router(budgets_router)
app.include_router(savings_router)
app.include_router(obligations_router)
app.include_router(investments_router)
app.include_router(major_purchase_router)
app.include_router(financing_agreement_router)
app.include_router(major_purchase_payment_router)


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