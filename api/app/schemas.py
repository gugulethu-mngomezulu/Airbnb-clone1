from decimal import Decimal
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

StayCategory = Literal[
    "Coastal", "Cabins", "City escapes", "Countryside", "Unique stays"
]
SortOrder = Literal["recommended", "price-low", "price-high", "rating"]
PriceFilter = Annotated[
    Decimal, Field(ge=0, max_digits=10, decimal_places=2, allow_inf_nan=False)
]


class StayFilters(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    destination: Annotated[str, Field(max_length=100, pattern=r"^[^\x00]*$")] = ""
    guests: Annotated[int, Field(ge=1, le=16)] = 1
    category: StayCategory | Literal["All stays"] = "All stays"
    min_price: PriceFilter = Decimal("0")
    max_price: PriceFilter | None = None
    sort: SortOrder = "recommended"

    @model_validator(mode="after")
    def validate_price_range(self) -> Self:
        if self.max_price is not None and self.min_price > self.max_price:
            raise ValueError("min_price must not exceed max_price")
        return self


class StayRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    location: str
    province: str
    category: StayCategory
    description: str
    price: float
    rating: float
    reviews: int
    guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    image: str
    gallery: list[str]
    tag: str
    host: str
    amenities: list[str]
