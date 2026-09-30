from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.ledger import LedgerEntry


class LedgerRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, entry: LedgerEntry) -> LedgerEntry:
        self.db.add(entry)
        self.db.flush()
        return entry

    def get_by_user_id(self, user_id: int) -> list[LedgerEntry]:
        statement = (
            select(LedgerEntry)
            .where(LedgerEntry.user_id == user_id)
            .order_by(LedgerEntry.occurred_at.desc())
        )

        return list(self.db.scalars(statement).all())

    def get_summary(self, user_id: int) -> dict:
        credits = self.db.scalar(
            select(func.coalesce(func.sum(LedgerEntry.amount), 0))
            .where(
                LedgerEntry.user_id == user_id,
                LedgerEntry.amount > 0,
            )
        )

        debits = self.db.scalar(
            select(func.coalesce(func.sum(LedgerEntry.amount), 0))
            .where(
                LedgerEntry.user_id == user_id,
                LedgerEntry.amount < 0,
            )
        )

        return {
            "total_in": credits,
            "total_out": abs(debits),
            "net_movement": credits + debits,
        }