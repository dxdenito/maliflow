"""migrate expenses to categories

Revision ID: 0b2212bd4ee0
Revises: 73c25edc46b7
Create Date: ...
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = "0b2212bd4ee0"
down_revision: Union[str, Sequence[str], None] = "73c25edc46b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.add_column(
        "expenses",
        sa.Column("category_id", sa.Integer(), nullable=True),
    )

    op.create_index(
        "ix_expenses_category_id",
        "expenses",
        ["category_id"],
    )

    op.create_foreign_key(
        "fk_expenses_category_id",
        "expenses",
        "expense_categories",
        ["category_id"],
        ["id"],
    )

    connection = op.get_bind()

    rows = connection.execute(
        sa.text("""
            SELECT DISTINCT user_id, category
            FROM expenses
            WHERE category IS NOT NULL
        """)
    ).fetchall()

    for user_id, category_name in rows:
        existing = connection.execute(
            sa.text("""
                SELECT id
                FROM expense_categories
                WHERE user_id = :user_id
                  AND lower(name) = lower(:name)
                LIMIT 1
            """),
            {
                "user_id": user_id,
                "name": category_name,
            },
        ).fetchone()

        if existing:
            category_id = existing[0]
        else:
            now = datetime.utcnow()

            result = connection.execute(
                sa.text("""
                    INSERT INTO expense_categories (
                        user_id,
                        name,
                        is_active,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        :user_id,
                        :name,
                        true,
                        :created_at,
                        :updated_at
                    )
                    RETURNING id
                """),
                {
                    "user_id": user_id,
                    "name": category_name,
                    "created_at": now,
                    "updated_at": now,
                },
            )
            category_id = result.scalar_one()

        connection.execute(
            sa.text("""
                UPDATE expenses
                SET category_id = :category_id
                WHERE user_id = :user_id
                  AND category = :category
            """),
            {
                "category_id": category_id,
                "user_id": user_id,
                "category": category_name,
            },
        )

    op.alter_column(
        "expenses",
        "category_id",
        nullable=False,
    )

    op.drop_column("expenses", "category")


def downgrade():
    op.add_column(
        "expenses",
        sa.Column("category", sa.String(length=100), nullable=True),
    )

    connection = op.get_bind()

    connection.execute(
        sa.text("""
            UPDATE expenses e
            SET category = c.name
            FROM expense_categories c
            WHERE e.category_id = c.id
        """)
    )

    op.alter_column(
        "expenses",
        "category",
        nullable=False,
    )

    op.drop_constraint(
        "fk_expenses_category_id",
        "expenses",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_expenses_category_id",
        table_name="expenses",
    )

    op.drop_column("expenses", "category_id")