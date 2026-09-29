from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.financial_account import FinancialAccount
from app.repositories.financial_account_repository import FinancialAccountRepository
from app.schemas.financial_account_schema import OpeningBalanceCreate


class FinancialAccountService:
    def __init__(self, db: Session):
        self.repository = FinancialAccountRepository(db)

    def get_account(self, user_id: int) -> FinancialAccount:
        account = self.repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        return account

    def set_opening_balance(
        self,
        user_id: int,
        balance_data: OpeningBalanceCreate,
    ) -> FinancialAccount:
        account = self.repository.get_by_user_id(user_id)

        if account:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Opening balance has already been set",
            )

        account = FinancialAccount(
            user_id=user_id,
            available_funds=balance_data.amount,
        )

        return self.repository.create(account)