
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.budget_schema import (
    BudgetCreate,
    BudgetResponse,
    BudgetUpdate,
)
from app.services.budget_service import BudgetService
from app.schemas.budget_schema import BudgetVsActualResponse

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"],
)


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    return service.create_budget(current_user.id, budget_data)


@router.get("", response_model=list[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    return service.get_budgets(current_user.id)


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    return service.get_budget(current_user.id, budget_id)


@router.patch("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    return service.update_budget(
        current_user.id,
        budget_id,
        budget_data,
    )


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    service.delete_budget(current_user.id, budget_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{budget_id}/actual",
    response_model=BudgetVsActualResponse,
)
def get_budget_vs_actual(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    return service.get_budget_vs_actual(
        current_user.id,
        budget_id,
    )