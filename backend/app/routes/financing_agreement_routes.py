from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.financing_agreement_schema import FinancingAgreementCreate, FinancingAgreementResponse, FinancingAgreementUpdate
from app.services import financing_agreement_service

router = APIRouter(prefix="/financing-agreements", tags=["Financing Agreements"])


@router.post("/", response_model=FinancingAgreementResponse, status_code=status.HTTP_201_CREATED)
def create_agreement(data: FinancingAgreementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return financing_agreement_service.create_agreement(db, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[FinancingAgreementResponse])
def get_agreements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return financing_agreement_service.get_agreements(db, current_user.id)


@router.get("/{agreement_id}", response_model=FinancingAgreementResponse)
def get_agreement(agreement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return financing_agreement_service.get_agreement(db, current_user.id, agreement_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/purchase/{purchase_id}", response_model=FinancingAgreementResponse)
def get_agreement_for_purchase(purchase_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return financing_agreement_service.get_agreement_for_purchase(db, current_user.id, purchase_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{agreement_id}", response_model=FinancingAgreementResponse)
def update_agreement(agreement_id: int, data: FinancingAgreementUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return financing_agreement_service.update_agreement(db, current_user.id, agreement_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))