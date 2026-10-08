from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.major_purchase_payment import MajorPurchasePayment
from app.repositories import major_purchase_payment_repository
from app.repositories import major_purchase_repository
from app.repositories import financing_agreement_repository
from app.repositories import major_purchase_payment_allocation_repository
from app.schemas.major_purchase_payment_schema import MajorPurchasePaymentCreate
from app.schemas.major_purchase_payment_allocation_schema import (
    MajorPurchasePaymentAllocationCreate,
)


def create_payment(
    db: Session,
    user_id: int,
    data: MajorPurchasePaymentCreate,
    allocations: list[MajorPurchasePaymentAllocationCreate],
) -> MajorPurchasePayment:
    purchase = major_purchase_repository.get_purchase(
        db,
        data.purchase_id,
        user_id,
    )

    if not purchase:
        raise ValueError("Major purchase not found")

    if purchase.status.value == "cancelled":
        raise ValueError("Cannot make a payment toward a cancelled purchase")

    agreement = None

    if data.financing_agreement_id:
        agreement = financing_agreement_repository.get_agreement(
            db,
            data.financing_agreement_id,
            user_id,
        )

        if not agreement:
            raise ValueError("Financing agreement not found")

        if agreement.purchase_id != purchase.id:
            raise ValueError(
                "Financing agreement does not belong to this purchase"
            )

    allocation_total = sum(
        (allocation.amount for allocation in allocations),
        Decimal("0"),
    )

    if allocation_total != data.amount:
        raise ValueError(
            "Payment allocations must equal the payment amount"
        )

    if not allocations:
        raise ValueError("At least one payment allocation is required")

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

    payment = major_purchase_payment_repository.create_payment(
        db,
        payment,
    )

    for allocation_data in allocations:
        allocation = MajorPurchasePaymentAllocation(
            payment_id=payment.id,
            funding_source=allocation_data.funding_source,
            amount=allocation_data.amount,
        )

        major_purchase_payment_allocation_repository.create_allocation(
            db,
            allocation,
        )

    return payment


def get_payment(
    db: Session,
    user_id: int,
    payment_id: int,
) -> MajorPurchasePayment:
    payment = major_purchase_payment_repository.get_payment(
        db,
        payment_id,
        user_id,
    )

    if not payment:
        raise ValueError("Major purchase payment not found")

    return payment


def get_purchase_payments(
    db: Session,
    user_id: int,
    purchase_id: int,
) -> list[MajorPurchasePayment]:
    purchase = major_purchase_repository.get_purchase(
        db,
        purchase_id,
        user_id,
    )

    if not purchase:
        raise ValueError("Major purchase not found")

    return major_purchase_payment_repository.get_payments_for_purchase(
        db,
        purchase_id,
        user_id,
    )


def get_payment_allocations(
    db: Session,
    user_id: int,
    payment_id: int,
):
    payment = get_payment(db, user_id, payment_id)

    return major_purchase_payment_allocation_repository.get_allocations_for_payment(
        db,
        payment.id,
    )