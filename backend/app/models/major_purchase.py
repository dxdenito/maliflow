from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PurchaseType(str, Enum):
    CASH = "cash"
    FINANCED = "financed"


class MajorPurchaseStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MajorPurchase(Base):
    __tablename__ = "major_purchases"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    purchase_price: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    purchase_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    purchase_type: Mapped[PurchaseType] = mapped_column(
        SQLEnum(PurchaseType, name="purchasetype"),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[MajorPurchaseStatus] = mapped_column(
        SQLEnum(MajorPurchaseStatus, name="majorpurchasestatus"),
        nullable=False,
        default=MajorPurchaseStatus.ACTIVE,
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

    user = relationship(
        "User",
        back_populates="major_purchases",
    )

    financing_agreement = relationship(
        "FinancingAgreement",
        back_populates="purchase",
        uselist=False,
        cascade="all, delete-orphan",
    )

    payments = relationship(
        "MajorPurchasePayment",
        back_populates="purchase",
        cascade="all, delete-orphan",
    )