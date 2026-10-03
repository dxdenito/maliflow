
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.investment import InvestmentStatus, InvestmentType


class InvestmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    investment_type: InvestmentType
    principal_amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    investment_date: date
    maturity_date: date | None = None
    description: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.maturity_date and self.maturity_date < self.investment_date:
            raise ValueError("Maturity date cannot be before investment date")
        return self


class InvestmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    investment_type: InvestmentType | None = None
    current_value: Decimal | None = Field(
        default=None, gt=0, max_digits=15, decimal_places=2
    )
    maturity_date: date | None = None
    description: str | None = None


class InvestmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    investment_type: InvestmentType
    principal_amount: Decimal
    current_value: Decimal
    investment_date: date
    maturity_date: date | None
    status: InvestmentStatus
    description: str | None
    created_at: datetime
    updated_at: datetime


class InvestmentRedemptionCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)


class InvestmentValuationUpdate(BaseModel):
    current_value: Decimal = Field(
        gt=0, max_digits=15, decimal_places=2
    )