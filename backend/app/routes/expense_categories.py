from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.expense_category_schema import (
    ExpenseCategoryCreate,
    ExpenseCategoryResponse,
    ExpenseCategoryUpdate,
)
from app.services.expense_category_service import ExpenseCategoryService


router = APIRouter(
    prefix="/expense-categories",
    tags=["Expense Categories"],
)


@router.post(
    "",
    response_model=ExpenseCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    category_data: ExpenseCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseCategoryService(db)
    return service.create_category(current_user.id, category_data)


@router.get("", response_model=list[ExpenseCategoryResponse])
def get_categories(
    active_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseCategoryService(db)
    return service.get_categories(current_user.id, active_only)


@router.get("/{category_id}", response_model=ExpenseCategoryResponse)
def get_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseCategoryService(db)
    return service.get_category(current_user.id, category_id)


@router.patch("/{category_id}", response_model=ExpenseCategoryResponse)
def update_category(
    category_id: int,
    category_data: ExpenseCategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseCategoryService(db)
    return service.update_category(
        current_user.id,
        category_id,
        category_data,
    )