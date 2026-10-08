from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.financing_agreement import FinancingAgreementStatus, PaymentFrequency


class FinancingAgreementBase(BaseModel):
    lender_name: str = Field(min_length=1, max_length=150)
    agreement_date: date
    deposit_amount: Decimal = Field(default=0, ge=0)
    financed_amount: Decimal = Field(gt=0)
    total_payable: Decimal | None = Field(default=None, gt=0)
    expected_term_months: int | None = Field(default=None, gt=0)
    expected_payment_amount: Decimal | None = Field(default=None, gt=0)
    payment_frequency: PaymentFrequency | None = None
    first_due_date: date | None = None
    custom_schedule_description: str | None = None


class FinancingAgreementCreate(FinancingAgreementBase):
    purchase_id: int


class FinancingAgreementUpdate(BaseModel):
    lender_name: str | None = Field(default=None, min_length=1, max_length=150)
    agreement_date: date | None = None
    total_payable: Decimal | None = Field(default=None, gt=0)
    expected_term_months: int | None = Field(default=None, gt=0)
    expected_payment_amount: Decimal | None = Field(default=None, gt=0)
    payment_frequency: PaymentFrequency | None = None
    first_due_date: date | None = None
    custom_schedule_description: str | None = None
    status: FinancingAgreementStatus | None = None


class FinancingAgreementResponse(FinancingAgreementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    purchase_id: int
    user_id: int
    status: FinancingAgreementStatus