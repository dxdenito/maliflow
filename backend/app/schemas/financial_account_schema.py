from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class OpeningBalanceCreate(BaseModel):
    amount: Decimal = Field(gt=0)


class FinancialAccountResponse(BaseModel):
    id: int
    available_funds: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}