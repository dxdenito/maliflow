from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.investment import InvestmentStatus, InvestmentType
from app.models.investment_transaction import InvestmentTransactionType


class InvestmentCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=150,
    )

    investment_type: InvestmentType

    # This is the first contribution used to open the account.
    principal_amount: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
    )

    investment_date: date

    maturity_date: date | None = None

    description: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.maturity_date
            and self.maturity_date < self.investment_date
        ):
            raise ValueError(
                "Maturity date cannot be before investment date"
            )

        return self


class InvestmentUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    investment_type: InvestmentType | None = None

    maturity_date: date | None = None

    description: str | None = None


class InvestmentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    investment_type: InvestmentType

    original_investment: Decimal
    current_invested_capital: Decimal
    current_value: Decimal

    investment_date: date
    maturity_date: date | None

    status: InvestmentStatus

    description: str | None

    created_at: datetime
    updated_at: datetime


class InvestmentContributionCreate(BaseModel):
    amount: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
    )


class InvestmentValuationCreate(BaseModel):
    current_value: Decimal = Field(
        ge=0,
        max_digits=15,
        decimal_places=2,
    )


class InvestmentWithdrawalCreate(BaseModel):
    amount: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
    )


class InvestmentTransactionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    investment_id: int
    transaction_type: InvestmentTransactionType

    amount: Decimal

    capital_component: Decimal
    profit_component: Decimal

    value_before: Decimal
    value_after: Decimal

    capital_before: Decimal
    capital_after: Decimal

    description: str | None

    occurred_at: datetime
    created_at: datetime