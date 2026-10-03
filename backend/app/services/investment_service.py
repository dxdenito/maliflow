
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_account import FinancialAccount
from app.models.investment import (
    Investment,
    InvestmentStatus,
)
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.repositories.investment_repository import InvestmentRepository
from app.repositories.ledger_repository import LedgerRepository
from app.schemas.investment_schema import InvestmentCreate, InvestmentUpdate


class InvestmentService:
    def __init__(self, db: Session):
        self.db = db
        self.investment_repo = InvestmentRepository(db)
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

    def get_investment(self, investment_id: int, user_id: int) -> Investment:
        investment = self.investment_repo.get_by_id(investment_id, user_id)
        if not investment:
            raise ValueError("Investment not found")
        return investment

    def create_investment(
        self, user_id: int, data: InvestmentCreate
    ) -> Investment:
        try:
            account = self._get_account(user_id)
            amount = data.principal_amount

            if account.available_funds < amount:
                raise ValueError("Insufficient available funds")

            account.available_funds -= amount

            investment = Investment(
                user_id=user_id,
                name=data.name.strip(),
                investment_type=data.investment_type,
                principal_amount=amount,
                current_value=amount,
                investment_date=data.investment_date,
                maturity_date=data.maturity_date,
                description=data.description,
                status=InvestmentStatus.ACTIVE,
            )
            self.investment_repo.create(investment)
            self.db.flush()

            occurred_at = datetime.now(timezone.utc)

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT,
                    amount=-amount,
                    is_internal=True,
                    description=f"Investment opened: {investment.name}",
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
                    description=f"Funds allocated to: {investment.name}",
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
                investment_id, user_id, lock=True
            )
            if not investment:
                raise ValueError("Investment not found")

            if investment.status == InvestmentStatus.REDEEMED:
                raise ValueError("A redeemed investment cannot be edited")

            updates = data.model_dump(exclude_unset=True)

            if "name" in updates and updates["name"] is not None:
                updates["name"] = updates["name"].strip()

            if "current_value" in updates:
                value = updates.pop("current_value")
                if value is not None:
                    investment.current_value = value

            for field, value in updates.items():
                setattr(investment, field, value)

            if (
                investment.maturity_date
                and investment.maturity_date < investment.investment_date
            ):
                raise ValueError(
                    "Maturity date cannot be before investment date"
                )

            self.investment_repo.update(investment)
            self.db.commit()
            self.db.refresh(investment)
            return investment

        except Exception:
            self.db.rollback()
            raise

    def redeem_investment(
        self,
        investment_id: int,
        user_id: int,
        amount: Decimal,
    ) -> Investment:
        try:
            investment = self.investment_repo.get_by_id(
                investment_id, user_id, lock=True
            )
            if not investment:
                raise ValueError("Investment not found")

            if investment.status == InvestmentStatus.REDEEMED:
                raise ValueError("Investment has already been redeemed")

            if amount <= 0:
                raise ValueError("Redemption amount must be positive")

            if amount > investment.current_value:
                raise ValueError(
                    "Redemption exceeds the investment's current value"
                )

            account = self._get_account(user_id)
            previous_value = investment.current_value

            investment.current_value -= amount
            account.available_funds += amount

            if investment.current_value == 0:
                investment.status = InvestmentStatus.REDEEMED
            else:
                investment.status = InvestmentStatus.PARTIALLY_REDEEMED

            self.investment_repo.update(investment)
            self.db.flush()

            occurred_at = datetime.now(timezone.utc)

            self.ledger_repo.create(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.INVESTMENT,
                    amount=-amount,
                    is_internal=True,
                    description=f"Investment redeemed: {investment.name}",
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
                    description=f"Proceeds returned: {investment.name}",
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