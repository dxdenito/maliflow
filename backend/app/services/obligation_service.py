
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_account import FinancialAccount
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.models.obligation import (
    Obligation,
    ObligationStatus,
)
from app.repositories.obligation_repository import ObligationRepository
from app.schemas.obligation_schema import (
    ObligationCreate,
    ObligationRepaymentCreate,
)


class ObligationService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ObligationRepository(db)

    def get_obligation(
        self,
        user_id: int,
        obligation_id: int,
    ) -> Obligation:
        obligation = self.repository.get_by_id(
            obligation_id,
            user_id,
        )

        if not obligation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Obligation not found",
            )

        return obligation

    def get_obligations(self, user_id: int) -> list[Obligation]:
        return self.repository.get_by_user_id(user_id)

    def create_obligation(
        self,
        user_id: int,
        data: ObligationCreate,
    ) -> Obligation:
        reason = data.reason.strip()

        if not reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Reason cannot be empty",
            )

        if data.due_date and data.due_date < data.obligation_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Due date cannot be before the obligation date",
            )

        obligation = Obligation(
            user_id=user_id,
            source=data.source,
            amount=data.amount,
            amount_paid=Decimal("0.00"),
            reason=reason,
            obligation_date=data.obligation_date,
            due_date=data.due_date,
            description=data.description,
            status=ObligationStatus.OUTSTANDING,
        )

        try:
            self.repository.create(obligation)
            self.db.commit()
            self.db.refresh(obligation)
            return obligation
        except Exception:
            self.db.rollback()
            raise

    def repay_obligation(
        self,
        user_id: int,
        obligation_id: int,
        data: ObligationRepaymentCreate,
    ) -> Obligation:
        try:
            obligation = self.repository.get_by_id(
                obligation_id,
                user_id,
                lock=True,
            )

            if not obligation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Obligation not found",
                )

            remaining = obligation.amount - obligation.amount_paid

            if data.amount > remaining:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Repayment exceeds the remaining balance",
                )

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

            if account.available_funds < data.amount:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insufficient available funds for repayment",
                )

            account.available_funds -= data.amount
            obligation.amount_paid += data.amount

            if obligation.amount_paid == obligation.amount:
                obligation.status = ObligationStatus.PAID
            else:
                obligation.status = ObligationStatus.PARTIALLY_PAID

            self.db.add(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.DEBT_REPAYMENT,
                    amount=-data.amount,
                    is_internal=False,
                    description=f"Repayment: {obligation.reason}",
                    reference_type="obligation",
                    reference_id=obligation.id,
                )
            )

            self.db.commit()
            self.db.refresh(obligation)
            return obligation

        except Exception:
            self.db.rollback()
            raise