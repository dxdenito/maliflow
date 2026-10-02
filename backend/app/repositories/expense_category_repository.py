from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense_category import ExpenseCategory


class ExpenseCategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, category: ExpenseCategory) -> ExpenseCategory:
        self.db.add(category)
        self.db.flush()
        return category

    def get_by_id(
        self,
        category_id: int,
        user_id: int,
    ) -> ExpenseCategory | None:
        statement = select(ExpenseCategory).where(
            ExpenseCategory.id == category_id,
            ExpenseCategory.user_id == user_id,
        )
        return self.db.scalar(statement)

    def get_by_name(
        self,
        user_id: int,
        name: str,
    ) -> ExpenseCategory | None:
        statement = select(ExpenseCategory).where(
            ExpenseCategory.user_id == user_id,
            ExpenseCategory.name.ilike(name),
        )
        return self.db.scalar(statement)

    def get_by_user_id(
        self,
        user_id: int,
        active_only: bool = False,
    ) -> list[ExpenseCategory]:
        statement = select(ExpenseCategory).where(
            ExpenseCategory.user_id == user_id
        )

        if active_only:
            statement = statement.where(ExpenseCategory.is_active.is_(True))

        statement = statement.order_by(ExpenseCategory.name.asc())

        return list(self.db.scalars(statement).all())

    def update(self, category: ExpenseCategory) -> ExpenseCategory:
        self.db.flush()
        return category