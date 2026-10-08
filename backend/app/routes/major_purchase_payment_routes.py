from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.major_purchase_payment_schema import MajorPurchasePaymentCreate, MajorPurchasePaymentResponse
from app.schemas.major_purchase_payment_allocation_schema import MajorPurchasePaymentAllocationCreate, MajorPurchasePaymentAllocationResponse
from app.services.major_purchase_payment_service import MajorPurchasePaymentService

router = APIRouter(prefix="/major-purchase-payments", tags=["Major Purchase Payments"])


class PaymentCreateRequest(MajorPurchasePaymentCreate):
    allocations: list[MajorPurchasePaymentAllocationCreate]


@router.post("/", response_model=MajorPurchasePaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(data: PaymentCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = MajorPurchasePaymentService(db)
    return service.create_payment(current_user.id, data, data.allocations)


@router.get("/purchase/{purchase_id}", response_model=list[MajorPurchasePaymentResponse])
def get_purchase_payments(purchase_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = MajorPurchasePaymentService(db)
    try:
        return service.get_purchase_payments(current_user.id, purchase_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{payment_id}", response_model=MajorPurchasePaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = MajorPurchasePaymentService(db)
    try:
        return service.get_payment(current_user.id, payment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{payment_id}/allocations", response_model=list[MajorPurchasePaymentAllocationResponse])
def get_payment_allocations(payment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = MajorPurchasePaymentService(db)
    try:
        return service.get_payment_allocations(current_user.id, payment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))