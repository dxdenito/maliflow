from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ledger_schema import (
    LedgerEntryResponse,
    LedgerSummaryResponse,
)
from app.services.ledger_service import LedgerService


router = APIRouter(prefix="/ledger", tags=["Ledger"])


@router.get("", response_model=list[LedgerEntryResponse])
def get_ledger(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LedgerService(db)
    return service.get_user_ledger(current_user.id)


@router.get("/summary", response_model=LedgerSummaryResponse)
def get_ledger_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LedgerService(db)
    return service.get_summary(current_user.id)