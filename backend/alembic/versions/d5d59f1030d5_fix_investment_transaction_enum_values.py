"""fix investment transaction enum values

Revision ID: d5d59f1030d5
Revises: c4cf46a44a3a
Create Date: 2026-10-04 16:19:01.408059

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5d59f1030d5'
down_revision: Union[str, Sequence[str], None] = 'c4cf46a44a3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema.""""""fix investment transaction enum values"""

from typing import Sequence, Union

from alembic import op


revision: str = "d5d59f1030d5"
down_revision: Union[str, Sequence[str], None] = "c4cf46a44a3a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type DROP DEFAULT
    """)

    op.execute("""
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type TYPE VARCHAR
        USING transaction_type::text
    """)

    op.execute("""
        UPDATE investment_transactions
        SET transaction_type = UPPER(transaction_type)
    """)

    op.execute("""
        DROP TYPE investment_transaction_type_enum
    """)

    op.execute("""
        CREATE TYPE investment_transaction_type_enum AS ENUM (
            'CONTRIBUTION',
            'VALUATION',
            'WITHDRAWAL'
        )
    """)

    op.execute("""
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type
        TYPE investment_transaction_type_enum
        USING transaction_type::investment_transaction_type_enum
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type DROP DEFAULT
    """)

    op.execute("""
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type TYPE VARCHAR
        USING transaction_type::text
    """)

    op.execute("""
        UPDATE investment_transactions
        SET transaction_type = LOWER(transaction_type)
    """)

    op.execute("""
        DROP TYPE investment_transaction_type_enum
    """)

    op.execute("""
        CREATE TYPE investment_transaction_type_enum AS ENUM (
            'contribution',
            'valuation',
            'withdrawal'
        )
    """)

    op.execute("""
        ALTER TABLE investment_transactions
        ALTER COLUMN transaction_type
        TYPE investment_transaction_type_enum
        USING transaction_type::investment_transaction_type_enum
    """)
    pass
