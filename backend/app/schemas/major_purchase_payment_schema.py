from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.major_purchase_payment import MajorPurchasePaymentType


class MajorPurchasePaymentBase(BaseModel):
    payment_date: date
    amount: Decimal = Field(gt=0)
    payment_type: MajorPurchasePaymentType
    reference: str | None = Field(default=None, max_length=150)
    notes: str | None = None


class MajorPurchasePaymentCreate(MajorPurchasePaymentBase):
    purchase_id: int
    financing_agreement_id: int | None = None


class MajorPurchasePaymentUpdate(BaseModel):
    payment_date: date | None = None
    reference: str | None = Field(default=None, max_length=150)
    notes: str | None = None


class MajorPurchasePaymentResponse(MajorPurchasePaymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    purchase_id: int
    financing_agreement_id: int | None