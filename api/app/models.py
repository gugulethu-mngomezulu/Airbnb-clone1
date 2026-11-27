from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    literal_column,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Stay(Base):
    __tablename__ = "stays"
    __table_args__ = (
        # Match PostgreSQL's reflected grouping so Alembic can compare the index.
        Index(
            "ix_stays_search",
            literal_column("((((name || ' ') || location) || ' ') || province)").label(
                "search_text"
            ),
            postgresql_using="gin",
            postgresql_ops={"search_text": "gin_trgm_ops"},
        ),
        CheckConstraint(
            "category IN ('Coastal', 'Cabins', 'City escapes', "
            "'Countryside', 'Unique stays')",
            name="ck_stays_category",
        ),
        CheckConstraint("price > 0", name="ck_stays_price"),
        CheckConstraint("rating >= 0 AND rating <= 5", name="ck_stays_rating"),
        CheckConstraint("reviews >= 0", name="ck_stays_reviews"),
        CheckConstraint("guests > 0", name="ck_stays_guests"),
        CheckConstraint("bedrooms >= 0", name="ck_stays_bedrooms"),
        CheckConstraint("beds > 0", name="ck_stays_beds"),
        CheckConstraint("bathrooms >= 0", name="ck_stays_bathrooms"),
    )

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    location: Mapped[str] = mapped_column(String(200))
    province: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(32), index=True)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), index=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), index=True)
    reviews: Mapped[int] = mapped_column(Integer)
    guests: Mapped[int] = mapped_column(SmallInteger, index=True)
    bedrooms: Mapped[int] = mapped_column(SmallInteger)
    beds: Mapped[int] = mapped_column(SmallInteger)
    bathrooms: Mapped[Decimal] = mapped_column(Numeric(4, 1))
    image: Mapped[str] = mapped_column(Text)
    gallery: Mapped[list[str]] = mapped_column(ARRAY(Text))
    tag: Mapped[str] = mapped_column(String(100))
    host: Mapped[str] = mapped_column(String(100))
    amenities: Mapped[list[str]] = mapped_column(ARRAY(Text))
