
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_account import FinancialAccount
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.schemas.savings_schema import SavingsTransferCreate


class SavingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_balances(self, user_id: int) -> FinancialAccount:
        account = self.db.scalar(
            select(FinancialAccount).where(
                FinancialAccount.user_id == user_id
            )
        )

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account not initialized",
            )

        return account

    def _transfer(
        self,
        user_id: int,
        transfer_data: SavingsTransferCreate,
        to_savings: bool,
    ) -> FinancialAccount:
        account = self.db.scalar(
            select(FinancialAccount)
            .where(FinancialAccount.user_id == user_id)
            .with_for_update()
        )

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account not initialized",
            )

        amount = transfer_data.amount

        if to_savings:
            if account.available_funds < amount:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insufficient available funds",
                )

            account.available_funds -= amount
            account.savings_funds += amount

            source_description = "Available Funds → Savings Fund"
            destination_description = "Transfer received by Savings Fund"

        else:
            if account.savings_funds < amount:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insufficient savings funds",
                )

            account.savings_funds -= amount
            account.available_funds += amount

            source_description = "Savings Fund → Available Funds"
            destination_description = "Transfer received by Available Funds"

        try:
            self.db.add_all([
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.TRANSFER,
                    amount=-amount,
                    is_internal=True,
                    description=source_description,
                    reference_type="financial_account",
                    reference_id=account.id,
                ),
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.TRANSFER,
                    amount=amount,
                    is_internal=True,
                    description=destination_description,
                    reference_type="financial_account",
                    reference_id=account.id,
                ),
            ])

            self.db.commit()
            self.db.refresh(account)
            return account

        except Exception:
            self.db.rollback()
            raise

    def transfer_to_savings(
        self,
        user_id: int,
        transfer_data: SavingsTransferCreate,
    ) -> FinancialAccount:
        return self._transfer(user_id, transfer_data, True)

    def withdraw_from_savings(
        self,
        user_id: int,
        transfer_data: SavingsTransferCreate,
    ) -> FinancialAccount:
        return self._transfer(user_id, transfer_data, False)