from sqlalchemy.orm import Session

from app.repositories.financial_account_repository import FinancialAccountRepository
from app.repositories.ledger_repository import LedgerRepository
from app.schemas.financial_position_schema import FinancialPositionResponse


class FinancialPositionService:
    def __init__(self, db: Session):
        self.financial_account_repository = FinancialAccountRepository(db)
        self.ledger_repository = LedgerRepository(db)

    def get_position(self, user_id: int) -> FinancialPositionResponse:
        account = self.financial_account_repository.get_by_user_id(user_id)

        if not account:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        summary = self.ledger_repository.get_summary(user_id)

        return FinancialPositionResponse(
            available_funds=account.available_funds,
            total_in=summary["total_in"],
            total_out=summary["total_out"],
            net_movement=summary["net_movement"],
        )