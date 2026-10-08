
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.financing_agreement import FinancingAgreement
from app.models.obligation import Obligation, ObligationSource, ObligationStatus
from app.repositories import financing_agreement_repository
from app.repositories import major_purchase_repository
from app.schemas.financing_agreement_schema import FinancingAgreementCreate, FinancingAgreementUpdate


def create_agreement(db: Session, user_id: int, data: FinancingAgreementCreate) -> FinancingAgreement:
    purchase = major_purchase_repository.get_purchase(db, data.purchase_id, user_id)
    if not purchase:
        raise ValueError("Major purchase not found")

    existing = financing_agreement_repository.get_agreement_by_purchase(db, data.purchase_id, user_id)
    if existing:
        raise ValueError("This purchase already has a financing agreement")

    if purchase.purchase_type.value != "financed":
        raise ValueError("Financing agreement requires a financed purchase")

    if data.deposit_amount > purchase.purchase_price:
        raise ValueError("Deposit cannot exceed purchase price")

    expected_financed_amount = purchase.purchase_price - data.deposit_amount

    if data.financed_amount != expected_financed_amount:
        raise ValueError("Financed amount must equal purchase price minus deposit")

    agreement = FinancingAgreement(
        user_id=user_id,
        **data.model_dump(),
    )

    try:
        financing_agreement_repository.create_agreement(db, agreement)

        obligation_amount = (
            data.total_payable
            if data.total_payable is not None
            else data.financed_amount
        )

        obligation = Obligation(
            user_id=user_id,
            financing_agreement_id=agreement.id,
            source=ObligationSource.OTHER,
            amount=obligation_amount,
            amount_paid=Decimal("0.00"),
            reason=f"{purchase.name} financing",
            obligation_date=data.agreement_date,
            due_date=data.first_due_date,
            description=f"Financing agreement with {data.lender_name}",
            status=ObligationStatus.OUTSTANDING,
        )

        db.add(obligation)

        db.commit()
        db.refresh(agreement)

        return agreement

    except Exception:
        db.rollback()
        raise


def get_agreement(db: Session, user_id: int, agreement_id: int) -> FinancingAgreement:
    agreement = financing_agreement_repository.get_agreement(db, agreement_id, user_id)

    if not agreement:
        raise ValueError("Financing agreement not found")

    return agreement


def get_agreement_for_purchase(db: Session, user_id: int, purchase_id: int) -> FinancingAgreement:
    agreement = financing_agreement_repository.get_agreement_by_purchase(db, purchase_id, user_id)

    if not agreement:
        raise ValueError("Financing agreement not found")

    return agreement


def get_agreements(db: Session, user_id: int) -> list[FinancingAgreement]:
    return financing_agreement_repository.get_agreements(db, user_id)


def update_agreement(
    db: Session,
    user_id: int,
    agreement_id: int,
    data: FinancingAgreementUpdate,
) -> FinancingAgreement:
    agreement = get_agreement(db, user_id, agreement_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(agreement, field, value)

    return financing_agreement_repository.update_agreement(db, agreement)
