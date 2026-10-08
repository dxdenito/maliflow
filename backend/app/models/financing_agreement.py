from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class FinancingAgreementStatus(str, Enum):
    ACTIVE = "active"
    SETTLED = "settled"
    CANCELLED = "cancelled"


class FinancingAgreement(Base):
    __tablename__ = "financing_agreements"

    id: Mapped[int] = mapped_column(primary_key=True)

    purchase_id: Mapped[int] = mapped_column(
        ForeignKey("major_purchases.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    lender_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    agreement_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    deposit_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=0,
    )

    financed_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    total_payable: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )

    expected_term_months: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    expected_payment_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )

    payment_frequency: Mapped[PaymentFrequency | None] = mapped_column(
        SQLEnum(PaymentFrequency, name="paymentfrequency"),
        nullable=True,
    )

    first_due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    custom_schedule_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[FinancingAgreementStatus] = mapped_column(
        SQLEnum(
            FinancingAgreementStatus,
            name="financingagreementstatus",
        ),
        nullable=False,
        default=FinancingAgreementStatus.ACTIVE,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    purchase = relationship(
        "MajorPurchase",
        back_populates="financing_agreement",
    )

    user = relationship(
        "User",
    )

    payments = relationship(
        "MajorPurchasePayment",
        back_populates="financing_agreement",
    )

    obligation = relationship(
        "Obligation",
        back_populates="financing_agreement",
        uselist=False,
    )
    obligation = relationship("Obligation", back_populates="financing_agreement", uselist=False)