from decimal import Decimal
from unittest.mock import MagicMock
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.dialects.postgresql import dialect
from sqlalchemy.orm import Session

from app.database import get_session
from app.main import app
from app.models import Stay
from app.schemas import StayFilters
from app.stays import build_stays_query
from seed import load_stays


@pytest.fixture
def api_client():
    session = MagicMock(spec=Session)
    session.scalars.return_value.all.return_value = []

    def override_session():
        yield session

    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            yield client, session
    finally:
        app.dependency_overrides.pop(get_session, None)


def test_list_returns_frontend_fields_with_json_numbers(api_client):
    client, session = api_client
    stay = Stay(**load_stays()[0].model_dump())
    session.scalars.return_value.all.return_value = [stay]
    response = client.get("/stays")
    assert response.status_code == 200
    row = response.json()[0]
    assert set(row) == set(Stay.__table__.columns.keys())
    assert row["id"] == stay.id
    assert row["price"] == 2450
    assert row["rating"] == 4.98
    assert row["bathrooms"] == 2
    for name in ["price", "rating", "bathrooms"]:
        assert isinstance(row[name], (int, float))
    assert row["gallery"] == stay.gallery
    assert row["amenities"] == stay.amenities


def test_list_passes_combined_filters_to_sql(api_client):
    client, session = api_client
    response = client.get(
        "/stays",
        params={
            "destination": "  Cape Town  ",
            "guests": 4,
            "category": "Coastal",
            "min_price": "1000.50",
            "max_price": "2500",
            "sort": "price-high",
        },
    )
    assert response.status_code == 200
    assert response.json() == []
    statement = session.scalars.call_args.args[0]
    compiled = statement.compile(dialect=dialect())
    sql = str(compiled)
    assert "ILIKE" in sql
    assert "stays.guests >=" in sql
    assert "stays.price >=" in sql
    assert "stays.price <=" in sql
    assert "stays.category =" in sql
    assert "ORDER BY stays.price DESC, stays.id" in sql
    for value in ["Cape Town", 4, "Coastal", Decimal("1000.50"), Decimal("2500")]:
        assert value in compiled.params.values()


def test_detail_returns_stay(api_client):
    client, session = api_client
    stay = Stay(**load_stays()[0].model_dump())
    session.get.return_value = stay
    response = client.get(f"/stays/{stay.id}")
    assert response.status_code == 200
    assert response.json()["id"] == stay.id
    session.get.assert_called_once_with(Stay, stay.id)


def test_missing_stay_returns_404(api_client):
    client, session = api_client
    session.get.return_value = None
    response = client.get("/stays/not-a-stay")
    assert response.status_code == 404
    assert response.json() == {"detail": "Stay not found"}


@pytest.mark.parametrize(
    "params",
    [
        {"guests": "0"},
        {"guests": "17"},
        {"guests": "1.5"},
        {"guests": "invalid"},
        {"category": "Unknown"},
        {"sort": "Unknown"},
        {"destination": "x" * 101},
        {"destination": "bad\x00query"},
        {"min_price": "-1"},
        {"max_price": "-1"},
        {"max_price": "NaN"},
        {"max_price": "Infinity"},
        {"max_price": "100000000"},
        {"min_price": "1.001"},
        {"min_price": "2000", "max_price": "1000"},
        {"unexpected": "parameter"},
    ],
)
def test_invalid_query_returns_422_without_querying_database(api_client, params):
    client, session = api_client
    response = client.get("/stays", params=params)
    assert response.status_code == 422
    session.scalars.assert_not_called()
    session.get.assert_not_called()


@pytest.mark.parametrize("stay_id", ["x" * 101, "bad\x00id"])
def test_invalid_stay_id_returns_422(api_client, stay_id):
    client, session = api_client
    response = client.get("/stays/" + quote(stay_id, safe=""))
    assert response.status_code == 422
    session.get.assert_not_called()


@pytest.mark.parametrize(
    ("sort", "order"),
    [
        ("recommended", "stays.id"),
        ("price-low", "stays.price ASC, stays.id"),
        ("price-high", "stays.price DESC, stays.id"),
        ("rating", "stays.rating DESC, stays.id"),
    ],
)
def test_sorting_is_in_sql_with_stable_id_ties(sort, order):
    statement = build_stays_query(StayFilters(sort=sort))
    sql = str(statement.compile(dialect=dialect()))
    assert sql.endswith(f"ORDER BY {order}")


def test_search_escapes_literal_wildcards_and_binds_user_input():
    statement = build_stays_query(StayFilters(destination="  O'Hara%_/  "))
    compiled = statement.compile(dialect=dialect())
    sql = str(compiled)
    assert "ILIKE" in sql
    assert "ESCAPE '/'" in sql
    assert "O'Hara" not in sql
    assert "O'Hara/%/_//" in compiled.params.values()


def test_blank_destination_and_all_stays_do_not_restrict_search_or_category():
    statement = build_stays_query(StayFilters(destination="   ", category="All stays"))
    sql = str(statement.compile(dialect=dialect()))
    assert "ILIKE" not in sql
    assert "stays.category =" not in sql
