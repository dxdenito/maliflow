from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.major_purchase_payment_allocation import PaymentFundingSource


class MajorPurchasePaymentAllocationBase(BaseModel):
    funding_source: PaymentFundingSource
    amount: Decimal = Field(gt=0)


class MajorPurchasePaymentAllocationCreate(MajorPurchasePaymentAllocationBase):
    pass


class MajorPurchasePaymentAllocationResponse(MajorPurchasePaymentAllocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_id: int