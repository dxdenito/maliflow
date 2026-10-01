from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class IncomeCreate(BaseModel):
    source: str = Field(min_length=1, max_length=100)
    amount: Decimal = Field(gt=0)
    received_date: date
    intended_period: date
    description: str | None = None


class IncomeUpdate(BaseModel):
    source: str | None = Field(default=None, min_length=1, max_length=100)
    amount: Decimal | None = Field(default=None, gt=0)
    received_date: date | None = None
    intended_period: date | None = None
    description: str | None = None


class IncomeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    amount: Decimal
    received_date: date
    intended_period: date
    description: str | None
    created_at: datetime
    updated_at: datetime