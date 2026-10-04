from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InvestmentType(str, Enum):
    STOCK = "stock"
    BOND = "bond"
    MMF = "mmf"
    SACCO = "sacco"
    CRYPTO = "crypto"
    BUSINESS = "business"
    REAL_ESTATE = "real_estate"
    OTHER = "other"


class InvestmentStatus(str, Enum):
    ACTIVE = "active"
    MATURED = "matured"


class Investment(Base):
    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    investment_type: Mapped[InvestmentType] = mapped_column(
        SQLEnum(
            InvestmentType,
            name="investment_type_enum",
        ),
        nullable=False,
    )

    # The very first contribution ever made to this investment account.
    original_investment: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    # Capital currently represented by the investment position.
    current_invested_capital: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    # Current market/provider value of the position.
    current_value: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    investment_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    maturity_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[InvestmentStatus] = mapped_column(
        SQLEnum(
            InvestmentStatus,
            name="investment_status_enum",
        ),
        nullable=False,
        default=InvestmentStatus.ACTIVE,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    @property
    def current_gain_loss(self) -> Decimal:
        return self.current_value - self.current_invested_capital