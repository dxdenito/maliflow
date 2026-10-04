from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.investment_transaction import InvestmentTransaction


class InvestmentTransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        transaction: InvestmentTransaction,
    ) -> InvestmentTransaction:
        self.db.add(transaction)
        self.db.flush()
        return transaction

    def get_by_investment_id(
        self,
        investment_id: int,
    ) -> list[InvestmentTransaction]:
        statement = (
            select(InvestmentTransaction)
            .where(
                InvestmentTransaction.investment_id == investment_id
            )
            .order_by(
                InvestmentTransaction.occurred_at.desc(),
                InvestmentTransaction.id.desc(),
            )
        )
        return list(self.db.scalars(statement).all())