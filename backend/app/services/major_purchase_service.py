from sqlalchemy.orm import Session

from app.models.major_purchase import MajorPurchase
from app.repositories import major_purchase_repository
from app.schemas.major_purchase_schema import MajorPurchaseCreate, MajorPurchaseUpdate


def create_purchase(db: Session, user_id: int, data: MajorPurchaseCreate) -> MajorPurchase:
    purchase = MajorPurchase(user_id=user_id, **data.model_dump())
    return major_purchase_repository.create_purchase(db, purchase)


def get_purchase(db: Session, user_id: int, purchase_id: int) -> MajorPurchase:
    purchase = major_purchase_repository.get_purchase(db, purchase_id, user_id)

    if not purchase:
        raise ValueError("Major purchase not found")

    return purchase


def get_purchases(db: Session, user_id: int) -> list[MajorPurchase]:
    return major_purchase_repository.get_purchases(db, user_id)


def update_purchase(
    db: Session,
    user_id: int,
    purchase_id: int,
    data: MajorPurchaseUpdate,
) -> MajorPurchase:
    purchase = get_purchase(db, user_id, purchase_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(purchase, field, value)

    return major_purchase_repository.update_purchase(db, purchase)