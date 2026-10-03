
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.savings_schema import (
    SavingsBalancesResponse,
    SavingsTransferCreate,
)
from app.services.savings_service import SavingsService
from fastapi import Query

from app.schemas.savings_schema import SavingsPerformanceResponse
from app.services.savings_performance_service import (
    SavingsPerformanceService,
)

router = APIRouter(prefix="/savings", tags=["Savings"])


@router.get("", response_model=SavingsBalancesResponse)
def get_savings_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SavingsService(db).get_balances(current_user.id)


@router.post("/deposit", response_model=SavingsBalancesResponse)
def transfer_to_savings(
    transfer_data: SavingsTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SavingsService(db).transfer_to_savings(
        current_user.id,
        transfer_data,
    )


@router.post("/withdraw", response_model=SavingsBalancesResponse)
def withdraw_from_savings(
    transfer_data: SavingsTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SavingsService(db).withdraw_from_savings(
        current_user.id,
        transfer_data,
    )

@router.get(
    "/performance",
    response_model=SavingsPerformanceResponse,
)
def get_savings_performance(
    year: int = Query(ge=2000, le=2100),
    month: int = Query(ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SavingsPerformanceService(db)

    return service.get_monthly_performance(
        user_id=current_user.id,
        year=year,
        month=month,
    )