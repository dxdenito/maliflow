from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_account import FinancialAccount
from app.models.ledger import LedgerEntry, LedgerEntryType
from app.models.major_purchase_payment import MajorPurchasePayment
from app.models.major_purchase_payment_allocation import MajorPurchasePaymentAllocation, PaymentFundingSource
from app.repositories import major_purchase_payment_repository
from app.repositories import major_purchase_payment_allocation_repository
from app.repositories import major_purchase_repository
from app.repositories import financing_agreement_repository
from app.repositories.obligation_repository import ObligationRepository
from app.schemas.major_purchase_payment_schema import MajorPurchasePaymentCreate
from app.schemas.major_purchase_payment_allocation_schema import MajorPurchasePaymentAllocationCreate


class MajorPurchasePaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.obligation_repository = ObligationRepository(db)

    def create_payment(
        self,
        user_id: int,
        data: MajorPurchasePaymentCreate,
        allocations: list[MajorPurchasePaymentAllocationCreate],
    ) -> MajorPurchasePayment:
        try:
            purchase = major_purchase_repository.get_purchase(
                self.db,
                data.purchase_id,
                user_id,
            )

            if not purchase:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Major purchase not found",
                )

            if purchase.status.value == "cancelled":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Cannot make a payment toward a cancelled purchase",
                )

            agreement = None

            if data.financing_agreement_id:
                agreement = financing_agreement_repository.get_agreement(
                    self.db,
                    data.financing_agreement_id,
                    user_id,
                )

                if not agreement:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Financing agreement not found",
                    )

                if agreement.purchase_id != purchase.id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Financing agreement does not belong to this purchase",
                    )

            if not allocations:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="At least one payment allocation is required",
                )

            allocation_total = sum(
                (allocation.amount for allocation in allocations),
                Decimal("0.00"),
            )

            if allocation_total != data.amount:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Payment allocations must equal the payment amount",
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

            available_amount = sum(
                (
                    allocation.amount
                    for allocation in allocations
                    if allocation.funding_source == PaymentFundingSource.AVAILABLE_FUNDS
                ),
                Decimal("0.00"),
            )

            savings_amount = sum(
                (
                    allocation.amount
                    for allocation in allocations
                    if allocation.funding_source == PaymentFundingSource.SAVINGS
                ),
                Decimal("0.00"),
            )

            if account.available_funds < available_amount:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insufficient available funds",
                )

            if account.savings_funds < savings_amount:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insufficient savings funds",
                )

            obligation = None

            if agreement and data.payment_type.value != "deposit":
                obligation = self.obligation_repository.get_by_financing_agreement(
                    agreement.id,
                    user_id,
                    lock=True,
                )

                if not obligation:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Financing obligation not found",
                    )

                remaining = obligation.amount - obligation.amount_paid

                if data.amount > remaining:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Payment exceeds the remaining financing balance",
                    )

            account.available_funds -= available_amount
            account.savings_funds -= savings_amount

            payment = MajorPurchasePayment(
                user_id=user_id,
                purchase_id=data.purchase_id,
                financing_agreement_id=data.financing_agreement_id,
                payment_date=data.payment_date,
                amount=data.amount,
                payment_type=data.payment_type,
                reference=data.reference,
                notes=data.notes,
            )

            self.db.add(payment)
            self.db.flush()

            for allocation_data in allocations:
                self.db.add(
                    MajorPurchasePaymentAllocation(
                        payment_id=payment.id,
                        funding_source=allocation_data.funding_source,
                        amount=allocation_data.amount,
                    )
                )

            self.db.add(
                LedgerEntry(
                    user_id=user_id,
                    entry_type=LedgerEntryType.MAJOR_PURCHASE,
                    amount=-data.amount,
                    is_internal=False,
                    description=f"Major purchase payment: {purchase.name}",
                    reference_type="major_purchase_payment",
                    reference_id=payment.id,
                )
            )

            if obligation:
                obligation.amount_paid += data.amount

                if obligation.amount_paid == obligation.amount:
                    from app.models.obligation import ObligationStatus

                    obligation.status = ObligationStatus.PAID
                else:
                    from app.models.obligation import ObligationStatus

                    obligation.status = ObligationStatus.PARTIALLY_PAID

            self.db.commit()
            self.db.refresh(payment)

            return payment

        except HTTPException:
            self.db.rollback()
            raise

        except Exception:
            self.db.rollback()
            raise

    def get_payment(
        self,
        user_id: int,
        payment_id: int,
    ) -> MajorPurchasePayment:
        payment = major_purchase_payment_repository.get_payment(
            self.db,
            payment_id,
            user_id,
        )

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Major purchase payment not found",
            )

        return payment

    def get_purchase_payments(
        self,
        user_id: int,
        purchase_id: int,
    ) -> list[MajorPurchasePayment]:
        purchase = major_purchase_repository.get_purchase(
            self.db,
            purchase_id,
            user_id,
        )

        if not purchase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Major purchase not found",
            )

        return major_purchase_payment_repository.get_payments_for_purchase(
            self.db,
            purchase_id,
            user_id,
        )

    def get_payment_allocations(
        self,
        user_id: int,
        payment_id: int,
    ) -> list[MajorPurchasePaymentAllocation]:
        self.get_payment(user_id, payment_id)

        return major_purchase_payment_allocation_repository.get_allocations_for_payment(
            self.db,
            payment_id,
        )