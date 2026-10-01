from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    amount: Decimal = Field(gt=0)
    expense_date: date
    description: str | None = None


class ExpenseUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: Decimal | None = Field(default=None, gt=0)
    expense_date: date | None = None
    description: str | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    amount: Decimal
    expense_date: date
    description: str | None
    created_at: datetime
    updated_at: datetime