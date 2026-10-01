from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense


class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, expense: Expense) -> Expense:
        self.db.add(expense)
        self.db.flush()
        return expense

    def get_by_id(self, expense_id: int, user_id: int) -> Expense | None:
        statement = select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
        return self.db.scalar(statement)

    def get_by_user_id(self, user_id: int) -> list[Expense]:
        statement = (
            select(Expense)
            .where(Expense.user_id == user_id)
            .order_by(Expense.expense_date.desc(), Expense.id.desc())
        )
        return list(self.db.scalars(statement).all())

    def update(self, expense: Expense) -> Expense:
        self.db.flush()
        return expense

    def delete(self, expense: Expense) -> None:
        self.db.delete(expense)
        self.db.flush()