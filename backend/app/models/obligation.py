from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ObligationStatus(str, Enum):
    OUTSTANDING = "outstanding"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"


class ObligationSource(str, Enum):
    INVESTMENT_FUND = "investment_fund"
    FAMILY = "family"
    FRIEND = "friend"
    BANK = "bank"
    SACCO = "sacco"
    MOBILE_LOAN = "mobile_loan"
    OTHER = "other"


class Obligation(Base):
    __tablename__ = "obligations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    source: Mapped[ObligationSource] = mapped_column(
        SQLEnum(ObligationSource),
        nullable=False,
        index=True,
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=Decimal("0.00"),
        server_default="0.00",
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    obligation_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[ObligationStatus] = mapped_column(
        SQLEnum(ObligationStatus),
        default=ObligationStatus.OUTSTANDING,
        server_default="OUTSTANDING",
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    @property
    def remaining_balance(self) -> Decimal:
        return self.amount - self.amount_paid