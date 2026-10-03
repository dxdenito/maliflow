from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BudgetCreate(BaseModel):
    category_id: int
    amount: Decimal = Field(gt=0)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")

        return self


class BudgetUpdate(BaseModel):
    category_id: int | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError("End date cannot be before start date")

        return self


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    amount: Decimal
    start_date: date
    end_date: date
    created_at: datetime
    updated_at: datetime


class BudgetVsActualResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    budget_id: int
    category_id: int
    budgeted_amount: Decimal
    actual_amount: Decimal
    remaining_amount: Decimal
    usage_percentage: Decimal
    is_overspent: bool

