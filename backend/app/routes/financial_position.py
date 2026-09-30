from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.financial_position_schema import FinancialPositionResponse
from app.services.financial_position_service import FinancialPositionService


router = APIRouter(prefix="/financial-position", tags=["Financial Position"])


@router.get("", response_model=FinancialPositionResponse)
def get_financial_position(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = FinancialPositionService(db)

    return service.get_position(current_user.id)