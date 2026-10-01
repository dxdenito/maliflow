from sqlalchemy.orm import Session

from app.models.ledger import LedgerEntry, LedgerEntryType
from app.repositories.ledger_repository import LedgerRepository


class LedgerService:
    def __init__(self, db: Session):
        self.repository = LedgerRepository(db)

    def create_entry(
        self,
        user_id: int,
        entry_type: LedgerEntryType,
        amount,
        description: str | None = None,
        reference_type: str | None = None,
        reference_id: int | None = None,
        is_internal: bool = False,
    ) -> LedgerEntry:
        entry = LedgerEntry(
            user_id=user_id,
            entry_type=entry_type,
            amount=amount,
            is_internal=is_internal,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id,
        )

        return self.repository.create(entry)

    def get_user_ledger(self, user_id: int) -> list[LedgerEntry]:
        return self.repository.get_by_user_id(user_id)

    def get_summary(self, user_id: int) -> dict:
        return self.repository.get_summary(user_id)