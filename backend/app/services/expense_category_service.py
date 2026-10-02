from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense_category import ExpenseCategory
from app.repositories.expense_category_repository import ExpenseCategoryRepository
from app.schemas.expense_category_schema import (
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate,
)


class ExpenseCategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ExpenseCategoryRepository(db)

    def get_category(
        self,
        user_id: int,
        category_id: int,
    ) -> ExpenseCategory:
        category = self.repository.get_by_id(category_id, user_id)

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense category not found",
            )

        return category

    def get_categories(
        self,
        user_id: int,
        active_only: bool = False,
    ) -> list[ExpenseCategory]:
        return self.repository.get_by_user_id(user_id, active_only)

    def create_category(
        self,
        user_id: int,
        category_data: ExpenseCategoryCreate,
    ) -> ExpenseCategory:
        name = category_data.name.strip()

        existing = self.repository.get_by_name(user_id, name)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An expense category with this name already exists",
            )

        category = ExpenseCategory(
            user_id=user_id,
            name=name,
        )

        self.repository.create(category)
        self.db.commit()
        self.db.refresh(category)

        return category

    def update_category(
        self,
        user_id: int,
        category_id: int,
        category_data: ExpenseCategoryUpdate,
    ) -> ExpenseCategory:
        category = self.get_category(user_id, category_id)

        if category_data.name is not None:
            name = category_data.name.strip()

            existing = self.repository.get_by_name(user_id, name)

            if existing and existing.id != category.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An expense category with this name already exists",
                )

            category.name = name

        if category_data.is_active is not None:
            category.is_active = category_data.is_active

        self.repository.update(category)
        self.db.commit()
        self.db.refresh(category)

        return category