from decimal import Decimal
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter
from sqlalchemy import Connection
from sqlalchemy.dialects.postgresql import insert

from app.config import Settings
from app.database import create_db_engine
from app.models import Stay

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "stays.json"


class SeedStay(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    id: Annotated[str, Field(min_length=1, max_length=100)]
    name: Annotated[str, Field(min_length=1, max_length=200)]
    location: Annotated[str, Field(min_length=1, max_length=200)]
    province: Annotated[str, Field(min_length=1, max_length=100)]
    category: Literal[
        "Coastal", "Cabins", "City escapes", "Countryside", "Unique stays"
    ]
    description: str
    price: Annotated[
        Decimal, Field(gt=0, max_digits=10, decimal_places=2, allow_inf_nan=False)
    ]
    rating: Annotated[
        Decimal, Field(ge=0, le=5, max_digits=3, decimal_places=2, allow_inf_nan=False)
    ]
    reviews: Annotated[int, Field(ge=0, le=2147483647)]
    guests: Annotated[int, Field(gt=0, le=32767)]
    bedrooms: Annotated[int, Field(ge=0, le=32767)]
    beds: Annotated[int, Field(gt=0, le=32767)]
    bathrooms: Annotated[
        Decimal, Field(ge=0, max_digits=4, decimal_places=1, allow_inf_nan=False)
    ]
    image: str
    gallery: list[str]
    tag: Annotated[str, Field(max_length=100)]
    host: Annotated[str, Field(max_length=100)]
    amenities: list[str]


_fixture_adapter = TypeAdapter(Annotated[list[SeedStay], Field(min_length=1)])


def load_stays(path: Path = FIXTURE_PATH) -> list[SeedStay]:
    stays = _fixture_adapter.validate_json(path.read_bytes())
    if len({stay.id for stay in stays}) != len(stays):
        raise ValueError("Fixture contains duplicate stay IDs")
    return stays


def seed_stays(connection: Connection, stays: list[SeedStay]) -> int:
    if not stays:
        return 0
    statement = (
        insert(Stay)
        .values([stay.model_dump() for stay in stays])
        .on_conflict_do_nothing(index_elements=[Stay.id])
        .returning(Stay.id)
    )
    return len(connection.execute(statement).scalars().all())


def main() -> None:
    stays = load_stays()
    engine = create_db_engine(Settings())
    try:
        with engine.begin() as connection:
            inserted = seed_stays(connection, stays)
    finally:
        engine.dispose()
    print(
        f"Seed complete: {inserted} inserted; {len(stays) - inserted} already present."
    )


if __name__ == "__main__":
    main()
