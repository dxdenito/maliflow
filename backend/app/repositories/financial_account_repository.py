from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_account import FinancialAccount


class FinancialAccountRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: int) -> FinancialAccount | None:
        statement = select(FinancialAccount).where(
            FinancialAccount.user_id == user_id
        )
        return self.db.scalar(statement)

    def create(self, account: FinancialAccount) -> FinancialAccount:
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account