"""fix investment status enum values

Revision ID: c4cf46a44a3a
Revises: 520180a7bcc6
Create Date: 2026-10-04 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "c4cf46a44a3a"
down_revision: Union[str, Sequence[str], None] = "520180a7bcc6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove the default temporarily.
    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status DROP DEFAULT
        """
    )

    # Convert enum to text so we can change the values.
    op.execute(
        """
        ALTER TABLE investments
        ALTER COLUMN status TYPE VARCHAR
        USING status::text
        """
    )

    # SQLAlchemy SQLEnum expects enum NAMES:
    # ACTIVE / MATURED
    op.execute(
        """
        UPDATE investments
        SET status = UPPER(status)
        """
    )

    # Replace the PostgreSQL enum.
    op.execute(
        """
        DROP TYPE investment_status_enum
        """
    )

    op.execute(
        """
        CREATE TYPE investment_status_enum AS ENUM (
            'ACTIVE',
            'MATURED'
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
        SET DEFAULT 'ACTIVE'::investment_status_enum
        """
    )


def downgrade() -> None:
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

    op.execute(
        """
        DROP TYPE investment_status_enum
        """
    )

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