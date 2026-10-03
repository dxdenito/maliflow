
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.investment_schema import (
    InvestmentCreate,
    InvestmentRedemptionCreate,
    InvestmentResponse,
    InvestmentUpdate,
)
from app.services.investment_service import InvestmentService

router = APIRouter(
    prefix="/investments",
    tags=["Investments"],
)

@router.get(
    "",
    response_model=list[InvestmentResponse],
)
def get_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvestmentService(db)
    return service.get_investments(current_user.id)

@router.get(
    "/{investment_id}",
    response_model=InvestmentResponse,
)
def get_investment(
    investment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvestmentService(db)

    try:
        return service.get_investment(
            investment_id,
            current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

@router.post(
    "",
    response_model=InvestmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_investment(
    data: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvestmentService(db)

    try:
        return service.create_investment(
            current_user.id,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

@router.patch(
    "/{investment_id}",
    response_model=InvestmentResponse,
)
def update_investment(
    investment_id: int,
    data: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvestmentService(db)

    try:
        return service.update_investment(
            investment_id,
            current_user.id,
            data,
        )
    except ValueError as exc:
        if str(exc) == "Investment not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

@router.post(
    "/{investment_id}/redeem",
    response_model=InvestmentResponse,
)
def redeem_investment(
    investment_id: int,
    data: InvestmentRedemptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvestmentService(db)

    try:
        return service.redeem_investment(
            investment_id,
            current_user.id,
            data.amount,
        )
    except ValueError as exc:
        if str(exc) == "Investment not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )