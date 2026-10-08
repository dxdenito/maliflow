from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.major_purchase import MajorPurchase


def create_purchase(db: Session, purchase: MajorPurchase) -> MajorPurchase:
    db.add(purchase)
    db.flush()
    db.refresh(purchase)
    return purchase


def get_purchase(db: Session, purchase_id: int, user_id: int) -> MajorPurchase | None:
    return db.scalar(
        select(MajorPurchase).where(
            MajorPurchase.id == purchase_id,
            MajorPurchase.user_id == user_id,
        )
    )


def get_purchases(db: Session, user_id: int) -> list[MajorPurchase]:
    return list(
        db.scalars(
            select(MajorPurchase)
            .where(MajorPurchase.user_id == user_id)
            .order_by(MajorPurchase.purchase_date.desc(), MajorPurchase.id.desc())
        ).all()
    )


def update_purchase(db: Session, purchase: MajorPurchase) -> MajorPurchase:
    db.flush()
    db.refresh(purchase)
    return purchase