"""Create stays and search indexes."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_table(
        "stays",
        sa.Column("id", sa.String(100), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("location", sa.String(200), nullable=False),
        sa.Column("province", sa.String(100), nullable=False),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("rating", sa.Numeric(3, 2), nullable=False),
        sa.Column("reviews", sa.Integer(), nullable=False),
        sa.Column("guests", sa.SmallInteger(), nullable=False),
        sa.Column("bedrooms", sa.SmallInteger(), nullable=False),
        sa.Column("beds", sa.SmallInteger(), nullable=False),
        sa.Column("bathrooms", sa.Numeric(4, 1), nullable=False),
        sa.Column("image", sa.Text(), nullable=False),
        sa.Column("gallery", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("tag", sa.String(100), nullable=False),
        sa.Column("host", sa.String(100), nullable=False),
        sa.Column("amenities", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.CheckConstraint(
            "category IN ('Coastal', 'Cabins', 'City escapes', "
            "'Countryside', 'Unique stays')",
            name="ck_stays_category",
        ),
        sa.CheckConstraint("price > 0", name="ck_stays_price"),
        sa.CheckConstraint("rating >= 0 AND rating <= 5", name="ck_stays_rating"),
        sa.CheckConstraint("reviews >= 0", name="ck_stays_reviews"),
        sa.CheckConstraint("guests > 0", name="ck_stays_guests"),
        sa.CheckConstraint("bedrooms >= 0", name="ck_stays_bedrooms"),
        sa.CheckConstraint("beds > 0", name="ck_stays_beds"),
        sa.CheckConstraint("bathrooms >= 0", name="ck_stays_bathrooms"),
        sa.PrimaryKeyConstraint("id", name="pk_stays"),
    )
    op.create_index("ix_stays_category", "stays", ["category"])
    op.create_index("ix_stays_guests", "stays", ["guests"])
    op.create_index("ix_stays_price", "stays", ["price"])
    op.create_index("ix_stays_rating", "stays", ["rating"])
    op.create_index(
        "ix_stays_search",
        "stays",
        [
            sa.literal_column(
                "((((name || ' ') || location) || ' ') || province)"
            ).label("search_text")
        ],
        postgresql_using="gin",
        postgresql_ops={"search_text": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_index("ix_stays_search", table_name="stays")
    op.drop_index("ix_stays_rating", table_name="stays")
    op.drop_index("ix_stays_price", table_name="stays")
    op.drop_index("ix_stays_guests", table_name="stays")
    op.drop_index("ix_stays_category", table_name="stays")
    op.drop_table("stays")
