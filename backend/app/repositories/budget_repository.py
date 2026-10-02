from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.budget import Budget
from datetime import date
from decimal import Decimal

from sqlalchemy import func
from app.models.expense import Expense


class BudgetRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, budget: Budget) -> Budget:
        self.db.add(budget)
        self.db.flush()
        return budget

    def get_by_id(
        self,
        budget_id: int,
        user_id: int,
    ) -> Budget | None:
        statement = select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == user_id,
        )

        return self.db.scalar(statement)

    def get_by_user_id(
        self,
        user_id: int,
    ) -> list[Budget]:
        statement = (
            select(Budget)
            .where(Budget.user_id == user_id)
            .order_by(
                Budget.start_date.desc(),
                Budget.id.desc(),
            )
        )

        return list(self.db.scalars(statement).all())

    def update(self, budget: Budget) -> Budget:
        self.db.flush()
        return budget

    def delete(self, budget: Budget) -> None:
        self.db.delete(budget)
        self.db.flush()

    
    def get_actual_spending(
        self,
        user_id: int,
        category_id: int,
        start_date: date,
        end_date: date,
    ) -> Decimal:
        statement = select(
            func.coalesce(func.sum(Expense.amount), 0)
        ).where(
            Expense.user_id == user_id,
            Expense.category_id == category_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
        )

        total = self.db.scalar(statement)
        return Decimal(str(total))