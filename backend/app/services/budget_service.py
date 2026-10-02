from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.expense_category import ExpenseCategory

from app.repositories.budget_repository import BudgetRepository
from app.repositories.expense_category_repository import ExpenseCategoryRepository

from app.schemas.budget_schema import BudgetCreate, BudgetUpdate
from decimal import Decimal

from app.schemas.budget_schema import (
    BudgetCreate,
    BudgetUpdate,
    BudgetVsActualResponse,
)


class BudgetService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = BudgetRepository(db)
        self.category_repository = ExpenseCategoryRepository(db)

    def get_budget(
        self,
        user_id: int,
        budget_id: int,
    ) -> Budget:
        budget = self.repository.get_by_id(
            budget_id,
            user_id,
        )

        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found",
            )

        return budget

    def get_budgets(
        self,
        user_id: int,
    ) -> list[Budget]:
        return self.repository.get_by_user_id(user_id)

    def _get_active_category(
        self,
        user_id: int,
        category_id: int,
    ) -> ExpenseCategory:
        category = self.category_repository.get_by_id(
            category_id,
            user_id,
        )

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense category not found",
            )

        if not category.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This expense category is inactive",
            )

        return category

    def _check_overlap(
        self,
        user_id: int,
        category_id: int,
        start_date,
        end_date,
        exclude_id: int | None = None,
    ):
        statement = select(Budget).where(
            Budget.user_id == user_id,
            Budget.category_id == category_id,
            Budget.start_date <= end_date,
            Budget.end_date >= start_date,
        )

        if exclude_id is not None:
            statement = statement.where(
                Budget.id != exclude_id
            )

        existing = self.db.scalar(statement)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A budget already exists for this "
                    "category during part of this period"
                ),
            )

    def create_budget(
        self,
        user_id: int,
        budget_data: BudgetCreate,
    ) -> Budget:
        self._get_active_category(
            user_id,
            budget_data.category_id,
        )

        self._check_overlap(
            user_id=user_id,
            category_id=budget_data.category_id,
            start_date=budget_data.start_date,
            end_date=budget_data.end_date,
        )

        budget = Budget(
            user_id=user_id,
            category_id=budget_data.category_id,
            amount=budget_data.amount,
            start_date=budget_data.start_date,
            end_date=budget_data.end_date,
        )

        self.repository.create(budget)

        self.db.commit()
        self.db.refresh(budget)

        return budget

    def update_budget(
        self,
        user_id: int,
        budget_id: int,
        budget_data: BudgetUpdate,
    ) -> Budget:
        budget = self.get_budget(
            user_id,
            budget_id,
        )

        category_id = (
            budget_data.category_id
            if budget_data.category_id is not None
            else budget.category_id
        )

        start_date = (
            budget_data.start_date
            if budget_data.start_date is not None
            else budget.start_date
        )

        end_date = (
            budget_data.end_date
            if budget_data.end_date is not None
            else budget.end_date
        )

        if end_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="End date cannot be before start date",
            )

        self._get_active_category(
            user_id,
            category_id,
        )

        self._check_overlap(
            user_id=user_id,
            category_id=category_id,
            start_date=start_date,
            end_date=end_date,
            exclude_id=budget.id,
        )

        budget.category_id = category_id
        budget.start_date = start_date
        budget.end_date = end_date

        if budget_data.amount is not None:
            budget.amount = budget_data.amount

        self.repository.update(budget)

        self.db.commit()
        self.db.refresh(budget)

        return budget

    def delete_budget(
        self,
        user_id: int,
        budget_id: int,
    ) -> None:
        budget = self.get_budget(
            user_id,
            budget_id,
        )

        self.repository.delete(budget)

        self.db.commit()

    
    def get_budget_vs_actual(
        self,
        user_id: int,
        budget_id: int,
    ) -> BudgetVsActualResponse:
        budget = self.get_budget(user_id, budget_id)

        actual = self.repository.get_actual_spending(
            user_id=user_id,
            category_id=budget.category_id,
            start_date=budget.start_date,
            end_date=budget.end_date,
        )

        budgeted = Decimal(str(budget.amount))
        remaining = budgeted - actual
        usage = (actual / budgeted) * Decimal("100")

        return BudgetVsActualResponse(
            budget_id=budget.id,
            category_id=budget.category_id,
            budgeted_amount=budgeted,
            actual_amount=actual,
            remaining_amount=remaining,
            usage_percentage=usage.quantize(Decimal("0.01")),
            is_overspent=actual > budgeted,
        )