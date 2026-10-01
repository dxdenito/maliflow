from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.income import Income


class IncomeRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, income: Income) -> Income:
        self.db.add(income)
        self.db.flush()
        return income

    def get_by_id(self, income_id: int, user_id: int) -> Income | None:
        statement = select(Income).where(
            Income.id == income_id,
            Income.user_id == user_id,
        )

        return self.db.scalar(statement)

    def get_by_user_id(self, user_id: int) -> list[Income]:
        statement = (
            select(Income)
            .where(Income.user_id == user_id)
            .order_by(
                Income.received_date.desc(),
                Income.id.desc(),
            )
        )

        return list(self.db.scalars(statement).all())

    def update(self, income: Income) -> Income:
        self.db.flush()
        return income

    def delete(self, income: Income) -> None:
        self.db.delete(income)
        self.db.flush()