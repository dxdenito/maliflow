from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MajorPurchasePaymentType(str, Enum):
    DEPOSIT = "deposit"
    INSTALMENT = "instalment"
    LUMP_SUM = "lump_sum"
    FINAL_SETTLEMENT = "final_settlement"
    CASH_PURCHASE = "cash_purchase"


class MajorPurchasePayment(Base):
    __tablename__ = "major_purchase_payments"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    purchase_id: Mapped[int] = mapped_column(ForeignKey("major_purchases.id", ondelete="CASCADE"), nullable=False, index=True)

    financing_agreement_id: Mapped[int | None] = mapped_column(ForeignKey("financing_agreements.id", ondelete="SET NULL"), nullable=True, index=True)

    payment_date: Mapped[date] = mapped_column(Date, nullable=False)

    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    payment_type: Mapped[MajorPurchasePaymentType] = mapped_column(SQLEnum(MajorPurchasePaymentType, name="majorpurchasepaymenttype"), nullable=False)

    reference: Mapped[str | None] = mapped_column(String(150), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")

    purchase = relationship("MajorPurchase", back_populates="payments")

    financing_agreement = relationship("FinancingAgreement", back_populates="payments")

    allocations = relationship("MajorPurchasePaymentAllocation", back_populates="payment", cascade="all, delete-orphan")