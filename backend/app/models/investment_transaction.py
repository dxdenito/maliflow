from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InvestmentTransactionType(str, Enum):
    CONTRIBUTION = "contribution"
    VALUATION = "valuation"
    WITHDRAWAL = "withdrawal"


class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    investment_id: Mapped[int] = mapped_column(
        ForeignKey(
            "investments.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    transaction_type: Mapped[InvestmentTransactionType] = mapped_column(
        SQLEnum(
            InvestmentTransactionType,
            name="investment_transaction_type_enum",
        ),
        nullable=False,
    )

    # For:
    # contribution = amount contributed
    # valuation = signed change in value
    # withdrawal = amount withdrawn
    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    # Amount of the transaction attributed to investment capital.
    capital_component: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0.00",
    )

    # Amount of the transaction attributed to investment profit.
    profit_component: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0.00",
    )

    value_before: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    value_after: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    capital_before: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    capital_after: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )