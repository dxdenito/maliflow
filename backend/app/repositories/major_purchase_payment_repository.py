from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.major_purchase_payment import MajorPurchasePayment


def create_payment(
    db: Session,
    payment: MajorPurchasePayment,
) -> MajorPurchasePayment:
    db.add(payment)
    db.flush()
    db.refresh(payment)
    return payment


def get_payment(
    db: Session,
    payment_id: int,
    user_id: int,
) -> MajorPurchasePayment | None:
    return db.scalar(
        select(MajorPurchasePayment).where(
            MajorPurchasePayment.id == payment_id,
            MajorPurchasePayment.user_id == user_id,
        )
    )


def get_payments_for_purchase(
    db: Session,
    purchase_id: int,
    user_id: int,
) -> list[MajorPurchasePayment]:
    return list(
        db.scalars(
            select(MajorPurchasePayment)
            .where(
                MajorPurchasePayment.purchase_id == purchase_id,
                MajorPurchasePayment.user_id == user_id,
            )
            .order_by(
                MajorPurchasePayment.payment_date.desc(),
                MajorPurchasePayment.id.desc(),
            )
        ).all()
    )


def get_payments_for_agreement(
    db: Session,
    financing_agreement_id: int,
    user_id: int,
) -> list[MajorPurchasePayment]:
    return list(
        db.scalars(
            select(MajorPurchasePayment)
            .where(
                MajorPurchasePayment.financing_agreement_id == financing_agreement_id,
                MajorPurchasePayment.user_id == user_id,
            )
            .order_by(
                MajorPurchasePayment.payment_date.desc(),
                MajorPurchasePayment.id.desc(),
            )
        ).all()
    )