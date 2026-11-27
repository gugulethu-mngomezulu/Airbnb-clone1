from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from .database import get_session
from .models import Stay
from .schemas import StayFilters, StayRead

router = APIRouter(prefix="/stays", tags=["stays"])
DatabaseSession = Annotated[Session, Depends(get_session)]


def build_stays_query(filters: StayFilters) -> Select[tuple[Stay]]:
    statement = select(Stay).where(
        Stay.guests >= filters.guests,
        Stay.price >= filters.min_price,
    )
    if filters.destination:
        search_text = Stay.name + " " + Stay.location + " " + Stay.province
        statement = statement.where(
            search_text.icontains(filters.destination, autoescape=True)
        )
    if filters.category != "All stays":
        statement = statement.where(Stay.category == filters.category)
    if filters.max_price is not None:
        statement = statement.where(Stay.price <= filters.max_price)

    ordering = {
        "price-low": Stay.price.asc(),
        "price-high": Stay.price.desc(),
        "rating": Stay.rating.desc(),
    }
    if filters.sort != "recommended":
        statement = statement.order_by(ordering[filters.sort])
    return statement.order_by(Stay.id)


@router.get("", response_model=list[StayRead])
def list_stays(
    filters: Annotated[StayFilters, Query()],
    session: DatabaseSession,
) -> Sequence[Stay]:
    return session.scalars(build_stays_query(filters)).all()


@router.get("/{stay_id}", response_model=StayRead)
def get_stay(
    stay_id: Annotated[str, Path(min_length=1, max_length=100, pattern=r"^[^\x00]*$")],
    session: DatabaseSession,
) -> Stay:
    stay = session.get(Stay, stay_id)
    if stay is None:
        raise HTTPException(status_code=404, detail="Stay not found")
    return stay
