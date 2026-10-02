from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.models.obligation import Obligation, ObligationSource

from app.repositories.expense_repository import ExpenseRepository
from app.repositories.financial_account_repository import FinancialAccountRepository
from app.repositories.ledger_repository import LedgerRepository
from app.repositories.obligation_repository import ObligationRepository
from app.repositories.expense_category_repository import ExpenseCategoryRepository

from app.schemas.expense_schema import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ExpenseRepository(db)
        self.account_repository = FinancialAccountRepository(db)
        self.ledger_repository = LedgerRepository(db)
        self.obligation_repository = ObligationRepository(db)
        self.category_repository = ExpenseCategoryRepository(db)

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

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

    def _get_active_category(
        self,
        user_id: int,
        category_id: int,
    ) -> ExpenseCategory:
        category = self.category_repository.get_by_id(
            category_id,
            user_id,
        )

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense category not found",
            )

        if not category.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This expense category is inactive",
            )

        return category

    def _get_expense_obligations(
        self,
        user_id: int,
        expense_id: int,
    ) -> list[Obligation]:
        return self.obligation_repository.get_by_expense(
            user_id,
            expense_id,
        )

    def _ensure_obligations_editable(
        self,
        user_id: int,
        expense_id: int,
    ) -> list[Obligation]:
        obligations = self._get_expense_obligations(
            user_id,
            expense_id,
        )

        for obligation in obligations:
            if obligation.amount_paid > 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "This expense cannot be modified because "
                        "its obligation has already been repaid."
                    ),
                )

        return obligations

    def _delete_obligation_ledger_entries(
        self,
        user_id: int,
        obligation_id: int,
    ) -> None:
        entries = self.db.scalars(
            select(LedgerEntry).where(
                LedgerEntry.user_id == user_id,
                LedgerEntry.reference_type == "obligation",
                LedgerEntry.reference_id == obligation_id,
                LedgerEntry.entry_type == LedgerEntryType.DEBT,
            )
        ).all()

        for entry in entries:
            self.db.delete(entry)

        self.db.flush()

    def _get_obligation_ledger_entry(
        self,
        user_id: int,
        obligation_id: int,
    ) -> LedgerEntry | None:
        return self.db.scalar(
            select(LedgerEntry).where(
                LedgerEntry.user_id == user_id,
                LedgerEntry.reference_type == "obligation",
                LedgerEntry.reference_id == obligation_id,
                LedgerEntry.entry_type == LedgerEntryType.DEBT,
            )
        )

    # ---------------------------------------------------------
    # Create
    # ---------------------------------------------------------

    def create_expense(
        self,
        user_id: int,
        expense_data: ExpenseCreate,
    ) -> Expense:
        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        category = self._get_active_category(
            user_id,
            expense_data.category_id,
        )

        amount = expense_data.amount
        available = account.available_funds

        funds_used = min(available, amount)
        shortfall = amount - funds_used

        expense = Expense(
            user_id=user_id,
            category_id=category.id,
            amount=amount,
            expense_date=expense_data.expense_date,
            description=expense_data.description,
        )

        self.repository.create(expense)

        account.available_funds -= funds_used

        self.ledger_repository.create(
            LedgerEntry(
                user_id=user_id,
                entry_type=LedgerEntryType.EXPENSE,
                amount=-amount,
                description=expense_data.description or category.name,
                reference_type="expense",
                reference_id=expense.id,
            )
        )

        if shortfall > 0:
            obligation = Obligation(
                user_id=user_id,
                expense_id=expense.id,
                source=ObligationSource.OTHER,
                amount=shortfall,
                reason=f"Expense shortfall: {category.name}",
                obligation_date=expense_data.expense_date,
                description=f"Shortfall created by expense of KSh {amount:.2f}",
            )

            self.obligation_repository.create(obligation)

            self.ledger_repository.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.DEBT,
                    amount=shortfall,
                    description="Expense shortfall obligation",
                    reference_type="obligation",
                    reference_id=obligation.id,
                )
            )

        self.db.commit()
        self.db.refresh(expense)

        return expense

    # ---------------------------------------------------------
    # Update
    # ---------------------------------------------------------

    def update_expense(
        self,
        user_id: int,
        expense_id: int,
        expense_data: ExpenseUpdate,
    ) -> Expense:
        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        expense = self.get_expense(
            user_id,
            expense_id,
        )

        obligations = self._ensure_obligations_editable(
            user_id,
            expense_id,
        )

        old_amount = expense.amount

        old_obligation_total = sum(
            (obligation.amount for obligation in obligations),
            Decimal("0.00"),
        )

        old_funds_used = old_amount - old_obligation_total

        if old_funds_used < 0:
            old_funds_used = Decimal("0.00")

        # Return the amount that was actually taken from Available Funds.
        account.available_funds += old_funds_used

        # -----------------------------------------------------
        # Category
        # -----------------------------------------------------

        category = None

        if expense_data.category_id is not None:
            category = self._get_active_category(
                user_id,
                expense_data.category_id,
            )
            expense.category_id = category.id
        else:
            category = self.category_repository.get_by_id(
                expense.category_id,
                user_id,
            )

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense category not found",
            )

        # -----------------------------------------------------
        # Other expense fields
        # -----------------------------------------------------

        if expense_data.amount is not None:
            expense.amount = expense_data.amount

        if expense_data.expense_date is not None:
            expense.expense_date = expense_data.expense_date

        if expense_data.description is not None:
            expense.description = expense_data.description

        new_amount = expense.amount

        # -----------------------------------------------------
        # Recalculate Available Funds / Shortfall
        # -----------------------------------------------------

        available = account.available_funds

        new_funds_used = min(
            available,
            new_amount,
        )

        new_shortfall = new_amount - new_funds_used

        account.available_funds -= new_funds_used

        # -----------------------------------------------------
        # Reconcile obligations
        # -----------------------------------------------------

        if new_shortfall <= 0:
            for obligation in obligations:
                self._delete_obligation_ledger_entries(
                    user_id,
                    obligation.id,
                )
                self.db.delete(obligation)

            self.db.flush()

        else:
            if obligations:
                primary_obligation = obligations[0]

                primary_obligation.amount = new_shortfall
                primary_obligation.reason = (
                    f"Expense shortfall: {category.name}"
                )
                primary_obligation.obligation_date = (
                    expense.expense_date
                )
                primary_obligation.description = (
                    f"Shortfall created by expense of KSh {new_amount:.2f}"
                )

                ledger_entry = self._get_obligation_ledger_entry(
                    user_id,
                    primary_obligation.id,
                )

                if ledger_entry:
                    ledger_entry.amount = new_shortfall
                    ledger_entry.description = (
                        "Expense shortfall obligation"
                    )
                else:
                    self.ledger_repository.create(
                        LedgerEntry(
                            user_id=user_id,
                            entry_type=LedgerEntryType.DEBT,
                            amount=new_shortfall,
                            description="Expense shortfall obligation",
                            reference_type="obligation",
                            reference_id=primary_obligation.id,
                        )
                    )

                # Remove any duplicate obligations.
                for extra_obligation in obligations[1:]:
                    self._delete_obligation_ledger_entries(
                        user_id,
                        extra_obligation.id,
                    )
                    self.db.delete(extra_obligation)

            else:
                obligation = Obligation(
                    user_id=user_id,
                    expense_id=expense.id,
                    source=ObligationSource.OTHER,
                    amount=new_shortfall,
                    reason=f"Expense shortfall: {category.name}",
                    obligation_date=expense.expense_date,
                    description=(
                        f"Shortfall created by expense "
                        f"of KSh {new_amount:.2f}"
                    ),
                )

                self.obligation_repository.create(obligation)

                self.ledger_repository.create(
                    LedgerEntry(
                        user_id=user_id,
                        entry_type=LedgerEntryType.DEBT,
                        amount=new_shortfall,
                        description="Expense shortfall obligation",
                        reference_type="obligation",
                        reference_id=obligation.id,
                    )
                )

        # -----------------------------------------------------
        # Update expense ledger
        # -----------------------------------------------------

        expense_ledger = self.db.scalar(
            select(LedgerEntry).where(
                LedgerEntry.user_id == user_id,
                LedgerEntry.reference_type == "expense",
                LedgerEntry.reference_id == expense.id,
                LedgerEntry.entry_type == LedgerEntryType.EXPENSE,
            )
        )

        if expense_ledger:
            expense_ledger.amount = -new_amount
            expense_ledger.description = (
                expense.description or category.name
            )
        else:
            self.ledger_repository.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.EXPENSE,
                    amount=-new_amount,
                    description=expense.description or category.name,
                    reference_type="expense",
                    reference_id=expense.id,
                )
            )

        self.repository.update(expense)

        self.db.commit()
        self.db.refresh(expense)

        return expense

    # ---------------------------------------------------------
    # Delete
    # ---------------------------------------------------------

    def delete_expense(
        self,
        user_id: int,
        expense_id: int,
    ) -> None:
        account = self.account_repository.get_by_user_id(user_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial account has not been initialized",
            )

        expense = self.get_expense(
            user_id,
            expense_id,
        )

        obligations = self._ensure_obligations_editable(
            user_id,
            expense_id,
        )

        obligation_total = sum(
            (obligation.amount for obligation in obligations),
            Decimal("0.00"),
        )

        funds_used = expense.amount - obligation_total

        if funds_used < 0:
            funds_used = Decimal("0.00")

        # Return only money that originally came from Available Funds.
        account.available_funds += funds_used

        # Delete obligation ledger entries and obligations.
        for obligation in obligations:
            self._delete_obligation_ledger_entries(
                user_id,
                obligation.id,
            )

            self.db.delete(obligation)

        # Delete expense ledger entry.
        expense_ledger = self.db.scalars(
            select(LedgerEntry).where(
                LedgerEntry.user_id == user_id,
                LedgerEntry.reference_type == "expense",
                LedgerEntry.reference_id == expense.id,
                LedgerEntry.entry_type == LedgerEntryType.EXPENSE,
            )
        ).all()

        for entry in expense_ledger:
            self.db.delete(entry)

        self.db.flush()

        self.repository.delete(expense)

        self.db.commit()