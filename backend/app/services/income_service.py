from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.income import Income
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.repositories.financial_account_repository import FinancialAccountRepository
from app.repositories.income_repository import IncomeRepository
from app.repositories.ledger_repository import LedgerRepository
from app.schemas.income_schema import IncomeCreate, IncomeUpdate


class IncomeService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = IncomeRepository(db)
        self.account_repository = FinancialAccountRepository(db)
        self.ledger_repository = LedgerRepository(db)

    def _is_early(self, income: Income) -> bool:
        return income.received_date < income.intended_period

    def create_income(self, user_id: int, income_data: IncomeCreate) -> Income:
        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        income = Income(
            user_id=user_id,
            source=income_data.source,
            amount=income_data.amount,
            received_date=income_data.received_date,
            intended_period=income_data.intended_period,
            description=income_data.description,
        )

        self.repository.create(income)

        if income_data.received_date < income_data.intended_period:
            account.reserved_funds += income_data.amount
        else:
            account.available_funds += income_data.amount

        self.ledger_repository.create(
            LedgerEntry(
                user_id=user_id,
                entry_type=LedgerEntryType.INCOME,
                amount=income_data.amount,
                description=income_data.description or income_data.source,
                reference_type="income",
                reference_id=income.id,
            )
        )

        self.db.commit()
        self.db.refresh(income)

        return income

    def get_income(self, user_id: int, income_id: int) -> Income:
        income = self.repository.get_by_id(income_id, user_id)

        if not income:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Income record not found",
            )

        return income

    def get_user_income(self, user_id: int) -> list[Income]:
        return self.repository.get_by_user_id(user_id)

    def update_income(
        self,
        user_id: int,
        income_id: int,
        income_data: IncomeUpdate,
    ) -> Income:
        income = self.get_income(user_id, income_id)

        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        old_amount = income.amount
        old_early = self._is_early(income)

        new_amount = (
            income_data.amount
            if income_data.amount is not None
            else income.amount
        )

        new_received_date = (
            income_data.received_date
            if income_data.received_date is not None
            else income.received_date
        )

        new_intended_period = (
            income_data.intended_period
            if income_data.intended_period is not None
            else income.intended_period
        )

        new_early = new_received_date < new_intended_period

        # Reverse the old financial effect.
        if old_early:
            account.reserved_funds -= old_amount
        else:
            account.available_funds -= old_amount

        # Apply the new financial effect.
        if new_early:
            account.reserved_funds += new_amount
        else:
            account.available_funds += new_amount

        if income_data.source is not None:
            income.source = income_data.source

        if income_data.amount is not None:
            income.amount = income_data.amount

        if income_data.received_date is not None:
            income.received_date = income_data.received_date

        if income_data.intended_period is not None:
            income.intended_period = income_data.intended_period

        if income_data.description is not None:
            income.description = income_data.description

        ledger_entry = self.ledger_repository.get_by_reference(
            user_id,
            "income",
            income.id,
        )

        if ledger_entry:
            ledger_entry.amount = new_amount
            ledger_entry.description = (
                income.description or income.source
            )

        self.db.commit()
        self.db.refresh(income)

        return income

    def delete_income(self, user_id: int, income_id: int) -> None:
        income = self.get_income(user_id, income_id)

        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        if self._is_early(income):
            account.reserved_funds -= income.amount
        else:
            account.available_funds -= income.amount

        ledger_entry = self.ledger_repository.get_by_reference(
            user_id,
            "income",
            income.id,
        )

        if ledger_entry:
            self.db.delete(ledger_entry)

        self.repository.delete(income)

        self.db.commit()