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

    def get_by_expense(self, user_id: int, expense_id: int) -> list[Obligation]:
        statement = select(Obligation).where(
            Obligation.user_id == user_id,
            Obligation.expense_id == expense_id,
        )
        return list(self.db.scalars(statement).all())