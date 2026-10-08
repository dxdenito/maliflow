from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories import major_purchase_payment_repository
from app.repositories import major_purchase_payment_allocation_repository


def get_allocations(
    db: Session,
    user_id: int,
    payment_id: int,
):
    payment = major_purchase_payment_repository.get_payment(
        db,
        payment_id,
        user_id,
    )

    if not payment:
        raise ValueError("Major purchase payment not found")

    return major_purchase_payment_allocation_repository.get_allocations_for_payment(
        db,
        payment_id,
    )


def validate_allocation_total(
    payment_amount: Decimal,
    allocation_amounts: list[Decimal],
) -> None:
    total = sum(allocation_amounts, Decimal("0"))

    if total != payment_amount:
        raise ValueError(
            "Payment allocations must equal payment amount"
        )