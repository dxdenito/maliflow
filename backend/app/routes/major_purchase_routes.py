from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.major_purchase_schema import MajorPurchaseCreate, MajorPurchaseResponse, MajorPurchaseUpdate
from app.services import major_purchase_service

router = APIRouter(prefix="/major-purchases", tags=["Major Purchases"])


@router.post("/", response_model=MajorPurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(data: MajorPurchaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return major_purchase_service.create_purchase(db, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[MajorPurchaseResponse])
def get_purchases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return major_purchase_service.get_purchases(db, current_user.id)


@router.get("/{purchase_id}", response_model=MajorPurchaseResponse)
def get_purchase(purchase_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return major_purchase_service.get_purchase(db, current_user.id, purchase_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{purchase_id}", response_model=MajorPurchaseResponse)
def update_purchase(purchase_id: int, data: MajorPurchaseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return major_purchase_service.update_purchase(db, current_user.id, purchase_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))