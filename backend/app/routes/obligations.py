
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.obligation_schema import (
    ObligationCreate,
    ObligationRepaymentCreate,
    ObligationResponse,
)
from app.services.obligation_service import ObligationService

router = APIRouter(prefix="/obligations", tags=["Obligations"])


@router.post(
    "",
    response_model=ObligationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_obligation(
    data: ObligationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ObligationService(db).create_obligation(
        current_user.id,
        data,
    )


@router.get("", response_model=list[ObligationResponse])
def get_obligations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ObligationService(db).get_obligations(current_user.id)


@router.get("/{obligation_id}", response_model=ObligationResponse)
def get_obligation(
    obligation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ObligationService(db).get_obligation(
        current_user.id,
        obligation_id,
    )


@router.post(
    "/{obligation_id}/repayments",
    response_model=ObligationResponse,
)
def repay_obligation(
    obligation_id: int,
    data: ObligationRepaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ObligationService(db).repay_obligation(
        current_user.id,
        obligation_id,
        data,
    )