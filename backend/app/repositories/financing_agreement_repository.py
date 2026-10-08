from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financing_agreement import FinancingAgreement


def create_agreement(db: Session, agreement: FinancingAgreement) -> FinancingAgreement:
    db.add(agreement)
    db.flush()
    db.refresh(agreement)
    return agreement


def get_agreement(db: Session, agreement_id: int, user_id: int) -> FinancingAgreement | None:
    return db.scalar(
        select(FinancingAgreement).where(
            FinancingAgreement.id == agreement_id,
            FinancingAgreement.user_id == user_id,
        )
    )


def get_agreement_by_purchase(
    db: Session,
    purchase_id: int,
    user_id: int,
) -> FinancingAgreement | None:
    return db.scalar(
        select(FinancingAgreement).where(
            FinancingAgreement.purchase_id == purchase_id,
            FinancingAgreement.user_id == user_id,
        )
    )


def get_agreements(db: Session, user_id: int) -> list[FinancingAgreement]:
    return list(
        db.scalars(
            select(FinancingAgreement)
            .where(FinancingAgreement.user_id == user_id)
            .order_by(FinancingAgreement.agreement_date.desc(), FinancingAgreement.id.desc())
        ).all()
    )


def update_agreement(
    db: Session,
    agreement: FinancingAgreement,
) -> FinancingAgreement:
    db.flush()
    db.refresh(agreement)
    return agreement