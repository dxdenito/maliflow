"""redesign investments as persistent accounts

Revision ID: 520180a7bcc6
Revises: 2f8a150e6050
Create Date: 2026-10-04 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "520180a7bcc6"
down_revision: Union[str, Sequence[str], None] = "2f8a150e6050"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------
    # 1. Rename investment columns
    # ---------------------------------------------------------

    op.alter_column(
        "investments",
        "principal_amount",
        new_column_name="original_investment",
    )

    op.alter_column(
        "investments",
        "principal_remaining",
        new_column_name="current_invested_capital",
    )

    # ---------------------------------------------------------
    # 2. Replace investment status enum
    # ---------------------------------------------------------

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status DROP DEFAULT
        """
    )

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status TYPE VARCHAR
        USING status::text
        """
    )

    # SQLAlchemy's native PostgreSQL enum stores the enum names
    # (e.g. ACTIVE, REDEEMED), so normalize them first.
    op.execute(
        """
        UPDATE investments
        SET status = LOWER(status)
        """
    )

    op.execute(
        """
        UPDATE investments
        SET status = 'active'
        WHERE status IN ('redeemed', 'partially_redeemed')
        """
    )

    op.execute("DROP TYPE investment_status_enum")

    op.execute(
        """
        CREATE TYPE investment_status_enum AS ENUM (
            'active',
            'matured'
        )
        """
    )

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status
        TYPE investment_status_enum
        USING status::investment_status_enum
        """
    )

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status
        SET DEFAULT 'active'::investment_status_enum
        """
    )

    # ---------------------------------------------------------
    # 3. Replace investment transaction enum
    # ---------------------------------------------------------

    op.execute(
        """
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type DROP DEFAULT
        """
    )

    op.execute(
        """
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type TYPE VARCHAR
        USING transaction_type::text
        """
    )

    # Normalize SQLAlchemy enum names:
    # INITIAL_INVESTMENT -> initial_investment
    # VALUATION          -> valuation
    # REDEMPTION         -> redemption
    op.execute(
        """
        UPDATE investment_transactions
        SET transaction_type = LOWER(transaction_type)
        """
    )

    op.execute(
        """
        UPDATE investment_transactions
        SET transaction_type = 'contribution'
        WHERE transaction_type = 'initial_investment'
        """
    )

    op.execute(
        """
        UPDATE investment_transactions
        SET transaction_type = 'withdrawal'
        WHERE transaction_type = 'redemption'
        """
    )

    op.execute("DROP TYPE investment_transaction_type_enum")

    op.execute(
        """
        CREATE TYPE investment_transaction_type_enum AS ENUM (
            'contribution',
            'valuation',
            'withdrawal'
        )
        """
    )

    op.execute(
        """
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type
        TYPE investment_transaction_type_enum
        USING transaction_type::investment_transaction_type_enum
        """
    )

    # ---------------------------------------------------------
    # 4. Add new transaction component/state columns
    # ---------------------------------------------------------

    op.add_column(
        "investment_transactions",
        sa.Column(
            "capital_component",
            sa.Numeric(15, 2),
            nullable=False,
            server_default="0.00",
        ),
    )

    op.add_column(
        "investment_transactions",
        sa.Column(
            "profit_component",
            sa.Numeric(15, 2),
            nullable=False,
            server_default="0.00",
        ),
    )

    op.add_column(
        "investment_transactions",
        sa.Column(
            "capital_before",
            sa.Numeric(15, 2),
            nullable=False,
            server_default="0.00",
        ),
    )

    op.add_column(
        "investment_transactions",
        sa.Column(
            "capital_after",
            sa.Numeric(15, 2),
            nullable=False,
            server_default="0.00",
        ),
    )

    # ---------------------------------------------------------
    # 5. Remove obsolete realized_gain_loss column
    # ---------------------------------------------------------

    op.drop_column(
        "investment_transactions",
        "realized_gain_loss",
    )

    # Remove temporary defaults.
    op.alter_column(
        "investment_transactions",
        "capital_component",
        server_default=None,
    )

    op.alter_column(
        "investment_transactions",
        "profit_component",
        server_default=None,
    )

    op.alter_column(
        "investment_transactions",
        "capital_before",
        server_default=None,
    )

    op.alter_column(
        "investment_transactions",
        "capital_after",
        server_default=None,
    )


def downgrade() -> None:
    # ---------------------------------------------------------
    # 1. Restore realized_gain_loss
    # ---------------------------------------------------------

    op.add_column(
        "investment_transactions",
        sa.Column(
            "realized_gain_loss",
            sa.Numeric(15, 2),
            nullable=True,
        ),
    )

    # ---------------------------------------------------------
    # 2. Remove new transaction columns
    # ---------------------------------------------------------

    op.drop_column(
        "investment_transactions",
        "capital_after",
    )

    op.drop_column(
        "investment_transactions",
        "capital_before",
    )

    op.drop_column(
        "investment_transactions",
        "profit_component",
    )

    op.drop_column(
        "investment_transactions",
        "capital_component",
    )

    # ---------------------------------------------------------
    # 3. Restore old transaction enum
    # ---------------------------------------------------------

    op.execute(
        """
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type DROP DEFAULT
        """
    )

    op.execute(
        """
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type TYPE VARCHAR
        USING transaction_type::text
        """
    )

    op.execute(
        """
        UPDATE investment_transactions
        SET transaction_type = 'initial_investment'
        WHERE transaction_type = 'contribution'
        """
    )

    op.execute(
        """
        UPDATE investment_transactions
        SET transaction_type = 'redemption'
        WHERE transaction_type = 'withdrawal'
        """
    )

    op.execute("DROP TYPE investment_transaction_type_enum")

    op.execute(
        """
        CREATE TYPE investment_transaction_type_enum AS ENUM (
            'initial_investment',
            'valuation',
            'redemption'
        )
        """
    )

    op.execute(
        """
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type
        TYPE investment_transaction_type_enum
        USING transaction_type::investment_transaction_type_enum
        """
    )

    # ---------------------------------------------------------
    # 4. Restore old investment status enum
    # ---------------------------------------------------------

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status DROP DEFAULT
        """
    )

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status TYPE VARCHAR
        USING status::text
        """
    )

    op.execute(
        """
        UPDATE investments
        SET status = LOWER(status)
        """
    )

    op.execute("DROP TYPE investment_status_enum")

    op.execute(
        """
        CREATE TYPE investment_status_enum AS ENUM (
            'active',
            'matured',
            'partially_redeemed',
            'redeemed'
        )
        """
    )

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status
        TYPE investment_status_enum
        USING status::investment_status_enum
        """
    )

    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status
        SET DEFAULT 'active'::investment_status_enum
        """
    )

    # ---------------------------------------------------------
    # 5. Restore old investment column names
    # ---------------------------------------------------------

    op.alter_column(
        "investments",
        "current_invested_capital",
        new_column_name="principal_remaining",
    )

    op.alter_column(
        "investments",
        "original_investment",
        new_column_name="principal_amount",
    )