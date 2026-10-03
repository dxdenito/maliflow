
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.investment import Investment


class InvestmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, investment: Investment) -> Investment:
        self.db.add(investment)
        self.db.flush()
        return investment

    def get_by_id(
        self,
        investment_id: int,
        user_id: int,
        lock: bool = False,
    ) -> Investment | None:
        statement = select(Investment).where(
            Investment.id == investment_id,
            Investment.user_id == user_id,
        )

        if lock:
            statement = statement.with_for_update()

        return self.db.scalar(statement)

    def get_by_user_id(self, user_id: int) -> list[Investment]:
        statement = (
            select(Investment)
            .where(Investment.user_id == user_id)
            .order_by(
                Investment.investment_date.desc(),
                Investment.id.desc(),
            )
        )

        return list(self.db.scalars(statement).all())

    def update(self, investment: Investment) -> Investment:
        self.db.flush()
        return investment

    def delete(self, investment: Investment) -> None:
        self.db.delete(investment)
        self.db.flush()