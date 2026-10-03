
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.obligation import ObligationSource, ObligationStatus


class ObligationCreate(BaseModel):
    source: ObligationSource
    amount: Decimal = Field(gt=0)
    reason: str = Field(min_length=1, max_length=255)
    obligation_date: date
    due_date: date | None = None
    description: str | None = None


class ObligationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    expense_id: int | None
    source: ObligationSource
    amount: Decimal
    amount_paid: Decimal
    remaining_balance: Decimal
    reason: str
    obligation_date: date
    due_date: date | None
    status: ObligationStatus
    description: str | None
    created_at: datetime
    updated_at: datetime


class ObligationRepaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0)