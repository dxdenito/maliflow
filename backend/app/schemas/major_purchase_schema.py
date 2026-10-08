from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.major_purchase import MajorPurchaseStatus, PurchaseType


class MajorPurchaseBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    purchase_price: Decimal = Field(gt=0)
    purchase_date: date
    purchase_type: PurchaseType
    description: str | None = None


class MajorPurchaseCreate(MajorPurchaseBase):
    pass


class MajorPurchaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    purchase_date: date | None = None
    description: str | None = None
    status: MajorPurchaseStatus | None = None


class MajorPurchaseResponse(MajorPurchaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: MajorPurchaseStatus