from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.financial_account_schema import (
    FinancialAccountResponse,
    OpeningBalanceCreate,
)
from app.services.financial_account_service import FinancialAccountService


router = APIRouter(prefix="/financial-account", tags=["Financial Account"])


@router.get("", response_model=FinancialAccountResponse)
def get_financial_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = FinancialAccountService(db)
    return service.get_account(current_user.id)


@router.post(
    "/opening-balance",
    response_model=FinancialAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_opening_balance(
    balance_data: OpeningBalanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = FinancialAccountService(db)

    return service.set_opening_balance(
        current_user.id,
        balance_data,
    )