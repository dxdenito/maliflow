from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.major_purchase_payment_allocation import MajorPurchasePaymentAllocation


def create_allocation(
    db: Session,
    allocation: MajorPurchasePaymentAllocation,
) -> MajorPurchasePaymentAllocation:
    db.add(allocation)
    db.flush()
    db.refresh(allocation)
    return allocation


def get_allocation(
    db: Session,
    allocation_id: int,
) -> MajorPurchasePaymentAllocation | None:
    return db.scalar(
        select(MajorPurchasePaymentAllocation).where(
            MajorPurchasePaymentAllocation.id == allocation_id
        )
    )


def get_allocations_for_payment(
    db: Session,
    payment_id: int,
) -> list[MajorPurchasePaymentAllocation]:
    return list(
        db.scalars(
            select(MajorPurchasePaymentAllocation)
            .where(
                MajorPurchasePaymentAllocation.payment_id == payment_id
            )
            .order_by(MajorPurchasePaymentAllocation.id)
        ).all()
    )


def delete_allocation(
    db: Session,
    allocation: MajorPurchasePaymentAllocation,
) -> None:
    db.delete(allocation)
    db.flush()