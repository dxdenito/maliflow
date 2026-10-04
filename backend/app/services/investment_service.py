from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_account import FinancialAccount
from app.models.investment import (
    Investment,
    InvestmentStatus,
)
from app.models.investment_transaction import (
    InvestmentTransaction,
    InvestmentTransactionType,
)
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.repositories.investment_repository import InvestmentRepository
from app.repositories.investment_transaction_repository import (
    InvestmentTransactionRepository,
)
from app.repositories.ledger_repository import LedgerRepository
from app.schemas.investment_schema import (
    InvestmentCreate,
    InvestmentUpdate,
)


class InvestmentService:
    def __init__(self, db: Session):
        self.db = db
        self.investment_repo = InvestmentRepository(db)
        self.transaction_repo = InvestmentTransactionRepository(db)
        self.ledger_repo = LedgerRepository(db)

    def _get_account(self, user_id: int) -> FinancialAccount:
        account = self.db.scalar(
            select(FinancialAccount)
            .where(FinancialAccount.user_id == user_id)
            .with_for_update()
        )

        if not account:
            raise ValueError("Financial account not found")

        return account

    def get_investments(self, user_id: int) -> list[Investment]:
        return self.investment_repo.get_by_user_id(user_id)

    def get_investment(
        self,
        investment_id: int,
        user_id: int,
    ) -> Investment:
        investment = self.investment_repo.get_by_id(
            investment_id,
            user_id,
        )

        if not investment:
            raise ValueError("Investment not found")

        return investment

    def get_transactions(
        self,
        investment_id: int,
        user_id: int,
    ) -> list[InvestmentTransaction]:
        self.get_investment(
            investment_id,
            user_id,
        )

        return self.transaction_repo.get_by_investment_id(
            investment_id
        )

    def create_investment(
        self,
        user_id: int,
        data: InvestmentCreate,
    ) -> Investment:
        try:
            account = self._get_account(user_id)

            amount = data.principal_amount

            if account.available_funds < amount:
                raise ValueError(
                    "Insufficient available funds"
                )

            account.available_funds -= amount

            investment = Investment(
                user_id=user_id,
                name=data.name.strip(),
                investment_type=data.investment_type,
                original_investment=amount,
                current_invested_capital=amount,
                current_value=amount,
                investment_date=data.investment_date,
                maturity_date=data.maturity_date,
                description=data.description,
                status=InvestmentStatus.ACTIVE,
            )

            self.investment_repo.create(investment)
            self.db.flush()

            occurred_at = datetime.now(timezone.utc)

            self.transaction_repo.create(
                InvestmentTransaction(
                    investment_id=investment.id,
                    transaction_type=InvestmentTransactionType.CONTRIBUTION,
                    amount=amount,
                    capital_component=amount,
                    profit_component=Decimal("0.00"),
                    value_before=Decimal("0.00"),
                    value_after=amount,
                    capital_before=Decimal("0.00"),
                    capital_after=amount,
                    description="Initial investment",
                    occurred_at=occurred_at,
                )
            )

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT,
                    amount=-amount,
                    is_internal=True,
                    description=f"Investment contribution: {investment.name}",
                    reference_type="investment",
                    reference_id=investment.id,
                    occurred_at=occurred_at,
                )
            )

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT,
                    amount=amount,
                    is_internal=True,
                    description=f"Investment position: {investment.name}",
                    reference_type="investment",
                    reference_id=investment.id,
                    occurred_at=occurred_at,
                )
            )

            self.db.commit()
            self.db.refresh(investment)

            return investment

        except Exception:
            self.db.rollback()
            raise

    def update_investment(
        self,
        investment_id: int,
        user_id: int,
        data: InvestmentUpdate,
    ) -> Investment:
        try:
            investment = self.investment_repo.get_by_id(
                investment_id,
                user_id,
                lock=True,
            )

            if not investment:
                raise ValueError("Investment not found")

            updates = data.model_dump(
                exclude_unset=True
            )

            if "name" in updates:
                if updates["name"] is not None:
                    updates["name"] = updates["name"].strip()

                    if not updates["name"]:
                        raise ValueError(
                            "Investment name cannot be empty"
                        )

            if (
                "maturity_date" in updates
                and updates["maturity_date"] is not None
                and updates["maturity_date"]
                < investment.investment_date
            ):
                raise ValueError(
                    "Maturity date cannot be before investment date"
                )

            for field, value in updates.items():
                setattr(
                    investment,
                    field,
                    value,
                )

            self.investment_repo.update(investment)

            self.db.commit()
            self.db.refresh(investment)

            return investment

        except Exception:
            self.db.rollback()
            raise

    def contribute(
        self,
        investment_id: int,
        user_id: int,
        amount: Decimal,
    ) -> Investment:
        try:
            if amount <= 0:
                raise ValueError(
                    "Contribution amount must be positive"
                )

            investment = self.investment_repo.get_by_id(
                investment_id,
                user_id,
                lock=True,
            )

            if not investment:
                raise ValueError("Investment not found")

            account = self._get_account(user_id)

            if account.available_funds < amount:
                raise ValueError(
                    "Insufficient available funds"
                )

            value_before = investment.current_value
            capital_before = (
                investment.current_invested_capital
            )

            account.available_funds -= amount

            investment.current_value += amount
            investment.current_invested_capital += amount

            occurred_at = datetime.now(timezone.utc)

            self.transaction_repo.create(
                InvestmentTransaction(
                    investment_id=investment.id,
                    transaction_type=InvestmentTransactionType.CONTRIBUTION,
                    amount=amount,
                    capital_component=amount,
                    profit_component=Decimal("0.00"),
                    value_before=value_before,
                    value_after=investment.current_value,
                    capital_before=capital_before,
                    capital_after=investment.current_invested_capital,
                    description="Investment contribution",
                    occurred_at=occurred_at,
                )
            )

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT,
                    amount=-amount,
                    is_internal=True,
                    description=f"Investment contribution: {investment.name}",
                    reference_type="investment",
                    reference_id=investment.id,
                    occurred_at=occurred_at,
                )
            )

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT,
                    amount=amount,
                    is_internal=True,
                    description=f"Investment position increased: {investment.name}",
                    reference_type="investment",
                    reference_id=investment.id,
                    occurred_at=occurred_at,
                )
            )

            self.db.commit()
            self.db.refresh(investment)

            return investment

        except Exception:
            self.db.rollback()
            raise

    def update_valuation(
        self,
        investment_id: int,
        user_id: int,
        current_value: Decimal,
    ) -> Investment:
        try:
            if current_value < 0:
                raise ValueError(
                    "Investment value cannot be negative"
                )

            investment = self.investment_repo.get_by_id(
                investment_id,
                user_id,
                lock=True,
            )

            if not investment:
                raise ValueError("Investment not found")

            value_before = investment.current_value

            if current_value == value_before:
                return investment

            capital_before = (
                investment.current_invested_capital
            )

            investment.current_value = current_value

            occurred_at = datetime.now(timezone.utc)

            self.transaction_repo.create(
                InvestmentTransaction(
                    investment_id=investment.id,
                    transaction_type=InvestmentTransactionType.VALUATION,
                    amount=current_value - value_before,
                    capital_component=Decimal("0.00"),
                    profit_component=Decimal("0.00"),
                    value_before=value_before,
                    value_after=current_value,
                    capital_before=capital_before,
                    capital_after=capital_before,
                    description="Investment valuation updated",
                    occurred_at=occurred_at,
                )
            )

            self.investment_repo.update(investment)

            self.db.commit()
            self.db.refresh(investment)

            return investment

        except Exception:
            self.db.rollback()
            raise

    def withdraw(
        self,
        investment_id: int,
        user_id: int,
        amount: Decimal,
    ) -> Investment:
        try:
            if amount <= 0:
                raise ValueError(
                    "Withdrawal amount must be positive"
                )

            investment = self.investment_repo.get_by_id(
                investment_id,
                user_id,
                lock=True,
            )

            if not investment:
                raise ValueError("Investment not found")

            if amount > investment.current_value:
                raise ValueError(
                    "Withdrawal exceeds the investment's current value"
                )

            account = self._get_account(user_id)

            value_before = investment.current_value
            capital_before = (
                investment.current_invested_capital
            )

            current_gain = max(
                value_before - capital_before,
                Decimal("0.00"),
            )

            profit_portion = min(
                amount,
                current_gain,
            )

            capital_portion = (
                amount - profit_portion
            )

            value_after = value_before - amount
            capital_after = (
                capital_before - capital_portion
            )

            account.available_funds += amount

            investment.current_value = value_after
            investment.current_invested_capital = capital_after

            occurred_at = datetime.now(timezone.utc)

            self.transaction_repo.create(
                InvestmentTransaction(
                    investment_id=investment.id,
                    transaction_type=InvestmentTransactionType.WITHDRAWAL,
                    amount=amount,
                    capital_component=capital_portion,
                    profit_component=profit_portion,
                    value_before=value_before,
                    value_after=value_after,
                    capital_before=capital_before,
                    capital_after=capital_after,
                    description=(
                        f"Investment withdrawal; "
                        f"profit: {profit_portion}, "
                        f"capital: {capital_portion}"
                    ),
                    occurred_at=occurred_at,
                )
            )

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT,
                    amount=-amount,
                    is_internal=True,
                    description=f"Investment withdrawal: {investment.name}",
                    reference_type="investment",
                    reference_id=investment.id,
                    occurred_at=occurred_at,
                )
            )

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT_RETURN,
                    amount=amount,
                    is_internal=True,
                    description=f"Investment proceeds returned: {investment.name}",
                    reference_type="investment",
                    reference_id=investment.id,
                    occurred_at=occurred_at,
                )
            )

            self.db.commit()
            self.db.refresh(investment)

            return investment

        except Exception:
            self.db.rollback()
            raise