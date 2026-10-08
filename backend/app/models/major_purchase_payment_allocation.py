from decimal import Decimal
from enum import Enum

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentFundingSource(str, Enum):
    AVAILABLE_FUNDS = "available_funds"
    SAVINGS = "savings"


class MajorPurchasePaymentAllocation(Base):
    __tablename__ = "major_purchase_payment_allocations"

    id: Mapped[int] = mapped_column(primary_key=True)

    payment_id: Mapped[int] = mapped_column(ForeignKey("major_purchase_payments.id", ondelete="CASCADE"), nullable=False, index=True)

    funding_source: Mapped[PaymentFundingSource] = mapped_column(SQLEnum(PaymentFundingSource, name="paymentfundingsource"), nullable=False)

    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    payment = relationship("MajorPurchasePayment", back_populates="allocations")