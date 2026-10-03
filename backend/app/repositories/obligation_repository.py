
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.obligation import Obligation


class ObligationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, obligation: Obligation) -> Obligation:
        self.db.add(obligation)
        self.db.flush()
        return obligation

    def get_by_id(
        self,
        obligation_id: int,
        user_id: int,
        lock: bool = False,
    ) -> Obligation | None:
        statement = select(Obligation).where(
            Obligation.id == obligation_id,
            Obligation.user_id == user_id,
        )

        if lock:
            statement = statement.with_for_update()

        return self.db.scalar(statement)

    def get_by_user_id(self, user_id: int) -> list[Obligation]:
        statement = (
            select(Obligation)
            .where(Obligation.user_id == user_id)
            .order_by(
                Obligation.obligation_date.desc(),
                Obligation.id.desc(),
            )
        )
        return list(self.db.scalars(statement).all())

    def get_by_expense(
        self,
        user_id: int,
        expense_id: int,
    ) -> list[Obligation]:
        statement = select(Obligation).where(
            Obligation.user_id == user_id,
            Obligation.expense_id == expense_id,
        )
        return list(self.db.scalars(statement).all())