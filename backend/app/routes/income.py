from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.income_schema import (
    IncomeCreate,
    IncomeResponse,
    IncomeUpdate,
)
from app.services.income_service import IncomeService


router = APIRouter(prefix="/income", tags=["Income"])


@router.post(
    "",
    response_model=IncomeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_income(
    income_data: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = IncomeService(db)

    return service.create_income(
        current_user.id,
        income_data,
    )


@router.get(
    "",
    response_model=list[IncomeResponse],
)
def get_income(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = IncomeService(db)

    return service.get_user_income(current_user.id)


@router.get(
    "/{income_id}",
    response_model=IncomeResponse,
)
def get_income_by_id(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = IncomeService(db)

    return service.get_income(
        current_user.id,
        income_id,
    )


@router.patch(
    "/{income_id}",
    response_model=IncomeResponse,
)
def update_income(
    income_id: int,
    income_data: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = IncomeService(db)

    return service.update_income(
        current_user.id,
        income_id,
        income_data,
    )


@router.delete(
    "/{income_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = IncomeService(db)

    service.delete_income(
        current_user.id,
        income_id,
    )