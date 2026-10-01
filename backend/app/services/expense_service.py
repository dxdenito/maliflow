from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.models.obligation import Obligation, ObligationSource
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.financial_account_repository import FinancialAccountRepository
from app.repositories.ledger_repository import LedgerRepository
from app.schemas.expense_schema import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ExpenseRepository(db)
        self.account_repository = FinancialAccountRepository(db)
        self.ledger_repository = LedgerRepository(db)

    def get_expense(self, user_id: int, expense_id: int) -> Expense:
        expense = self.repository.get_by_id(expense_id, user_id)

        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense record not found",
            )

        return expense

    def get_user_expenses(self, user_id: int) -> list[Expense]:
        return self.repository.get_by_user_id(user_id)

    def create_expense(self, user_id: int, expense_data: ExpenseCreate) -> Expense:
        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        amount = expense_data.amount
        available = account.available_funds

        expense = Expense(
            user_id=user_id,
            category=expense_data.category,
            amount=amount,
            expense_date=expense_data.expense_date,
            description=expense_data.description,
        )

        self.repository.create(expense)

        funds_used = min(available, amount)
        shortfall = amount - funds_used

        account.available_funds -= funds_used

        self.ledger_repository.create(
            LedgerEntry(
                user_id=user_id,
                entry_type=LedgerEntryType.EXPENSE,
                amount=-amount,
                description=expense_data.description or expense_data.category,
                reference_type="expense",
                reference_id=expense.id,
            )
        )

        if shortfall > 0:
            self.db.add(
                Obligation(
                    user_id=user_id,
                    source=ObligationSource.OTHER,
                    amount=shortfall,
                    reason=f"Expense shortfall: {expense_data.category}",
                    obligation_date=expense_data.expense_date,
                    description=(
                        f"Shortfall created by expense of "
                        f"KSh {amount:.2f}"
                    ),
                )
            )

            self.ledger_repository.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.DEBT,
                    amount=shortfall,
                    description="Expense shortfall obligation",
                    reference_type="expense",
                    reference_id=expense.id,
                )
            )

        self.db.commit()
        self.db.refresh(expense)

        return expense

    def update_expense(
        self,
        user_id: int,
        expense_id: int,
        expense_data: ExpenseUpdate,
    ) -> Expense:
        expense = self.get_expense(user_id, expense_id)

        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        old_amount = expense.amount
        new_amount = (
            expense_data.amount
            if expense_data.amount is not None
            else old_amount
        )

        difference = new_amount - old_amount

        if difference > 0:
            if account.available_funds >= difference:
                account.available_funds -= difference
            else:
                shortfall = difference - account.available_funds
                account.available_funds = 0

                self.db.add(
                    Obligation(
                        user_id=user_id,
                        source=ObligationSource.OTHER,
                        amount=shortfall,
                        reason=f"Expense update shortfall: {expense.category}",
                        obligation_date=expense.expense_date,
                        description="Additional obligation created by expense update",
                    )
                )
        elif difference < 0:
            account.available_funds += abs(difference)

        if expense_data.category is not None:
            expense.category = expense_data.category

        if expense_data.amount is not None:
            expense.amount = expense_data.amount

        if expense_data.expense_date is not None:
            expense.expense_date = expense_data.expense_date

        if expense_data.description is not None:
            expense.description = expense_data.description

        ledger_entry = self.ledger_repository.get_by_reference(
            user_id,
            "expense",
            expense.id,
        )

        if ledger_entry:
            ledger_entry.amount = -new_amount
            ledger_entry.description = (
                expense.description or expense.category
            )

        self.db.commit()
        self.db.refresh(expense)

        return expense

    def delete_expense(self, user_id: int, expense_id: int) -> None:
        expense = self.get_expense(user_id, expense_id)

        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        account.available_funds += expense.amount

        ledger_entry = self.ledger_repository.get_by_reference(
            user_id,
            "expense",
            expense.id,
        )

        if ledger_entry:
            self.db.delete(ledger_entry)

        self.repository.delete(expense)

        self.db.commit()