from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Stay
from seed import load_stays, seed_stays

ALL_IDS = [
    "alpha-coast",
    "bravo-cabin",
    "charlie-city",
    "delta-unique",
    "echo-country",
]


@pytest.fixture
def integration_stays():
    base = load_stays()[0]
    definitions = [
        {
            "id": "alpha-coast",
            "name": "Ocean House",
            "location": "Cape Town",
            "province": "Western Cape",
            "category": "Coastal",
            "price": Decimal("1000.50"),
            "rating": Decimal("4.80"),
            "guests": 2,
            "bathrooms": Decimal("1.5"),
        },
        {
            "id": "bravo-cabin",
            "name": "Forest Cabin",
            "location": "Knysna",
            "province": "Western Cape",
            "category": "Cabins",
            "price": Decimal("1500"),
            "rating": Decimal("4.90"),
            "guests": 4,
        },
        {
            "id": "charlie-city",
            "name": "City Loft",
            "location": "Johannesburg",
            "province": "Gauteng",
            "category": "City escapes",
            "price": Decimal("1500"),
            "rating": Decimal("4.90"),
            "guests": 6,
        },
        {
            "id": "delta-unique",
            "name": "100% Private_Home / O'Hara",
            "location": "Durban",
            "province": "KwaZulu-Natal",
            "category": "Unique stays",
            "price": Decimal("2000"),
            "rating": Decimal("4.70"),
            "guests": 4,
        },
        {
            "id": "echo-country",
            "name": "Farm Stay",
            "location": "Franschhoek",
            "province": "Western Cape",
            "category": "Countryside",
            "price": Decimal("500"),
            "rating": Decimal("4.95"),
            "guests": 8,
        },
    ]
    return [base.model_copy(update=definition) for definition in definitions]


@pytest.fixture
def populated_client(db_client, db_connection, integration_stays):
    assert seed_stays(db_connection, list(reversed(integration_stays))) == len(
        integration_stays
    )
    return db_client


def _ids(client, params=None):
    response = client.get("/stays", params=params)
    assert response.status_code == 200
    return [stay["id"] for stay in response.json()]


def test_default_listing_and_blank_filters(populated_client):
    assert _ids(populated_client) == ALL_IDS
    assert (
        _ids(populated_client, {"destination": "  ", "category": "All stays"})
        == ALL_IDS
    )


@pytest.mark.parametrize(
    ("destination", "expected"),
    [
        ("  cApE tOwN  ", ["alpha-coast"]),
        ("Forest", ["bravo-cabin"]),
        ("gauteng", ["charlie-city"]),
        ("Western Cape", ["alpha-coast", "bravo-cabin", "echo-country"]),
        ("Knysna Western", ["bravo-cabin"]),
        ("%", ["delta-unique"]),
        ("_", ["delta-unique"]),
        ("/", ["delta-unique"]),
        ("O'Hara", ["delta-unique"]),
        ("unknown destination", []),
        ("' OR 1=1 --", []),
    ],
)
def test_destination_search(populated_client, destination, expected):
    assert _ids(populated_client, {"destination": destination}) == expected


@pytest.mark.parametrize(
    ("guests", "expected"),
    [
        (4, ["bravo-cabin", "charlie-city", "delta-unique", "echo-country"]),
        (6, ["charlie-city", "echo-country"]),
        (16, []),
    ],
)
def test_minimum_guest_capacity(populated_client, guests, expected):
    assert _ids(populated_client, {"guests": guests}) == expected


@pytest.mark.parametrize(
    ("category", "expected"),
    [
        ("Coastal", ["alpha-coast"]),
        ("Cabins", ["bravo-cabin"]),
        ("City escapes", ["charlie-city"]),
        ("Unique stays", ["delta-unique"]),
        ("Countryside", ["echo-country"]),
    ],
)
def test_categories(populated_client, category, expected):
    assert _ids(populated_client, {"category": category}) == expected


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        (
            {"min_price": "1500"},
            ["bravo-cabin", "charlie-city", "delta-unique"],
        ),
        (
            {"max_price": "1500"},
            ["alpha-coast", "bravo-cabin", "charlie-city", "echo-country"],
        ),
        ({"min_price": "1500", "max_price": "1500"}, ["bravo-cabin", "charlie-city"]),
        ({"min_price": "1000.50", "max_price": "1000.50"}, ["alpha-coast"]),
        ({"max_price": "1000.49"}, ["echo-country"]),
        ({"max_price": "0"}, []),
    ],
)
def test_inclusive_price_bounds(populated_client, params, expected):
    assert _ids(populated_client, params) == expected


def test_combined_filters_are_all_required(populated_client):
    params = {
        "destination": "Western Cape",
        "guests": 4,
        "category": "Cabins",
        "min_price": "1500",
        "max_price": "1500",
        "sort": "price-high",
    }
    assert _ids(populated_client, params) == ["bravo-cabin"]
    assert _ids(populated_client, {**params, "guests": 5}) == []
    assert (
        _ids(populated_client, {**params, "min_price": "1500.01", "max_price": "2000"})
        == []
    )


@pytest.mark.parametrize(
    ("sort", "expected"),
    [
        ("recommended", ALL_IDS),
        (
            "price-low",
            [
                "echo-country",
                "alpha-coast",
                "bravo-cabin",
                "charlie-city",
                "delta-unique",
            ],
        ),
        (
            "price-high",
            [
                "delta-unique",
                "bravo-cabin",
                "charlie-city",
                "alpha-coast",
                "echo-country",
            ],
        ),
        (
            "rating",
            [
                "echo-country",
                "bravo-cabin",
                "charlie-city",
                "alpha-coast",
                "delta-unique",
            ],
        ),
    ],
)
def test_sorting_and_id_tie_breakers(populated_client, sort, expected):
    assert _ids(populated_client, {"sort": sort}) == expected


def test_detail_matches_every_field_and_uses_json_numbers(
    populated_client, integration_stays
):
    stay = integration_stays[0]
    response = populated_client.get(f"/stays/{stay.id}")
    assert response.status_code == 200
    expected = {
        **stay.model_dump(),
        "price": float(stay.price),
        "rating": float(stay.rating),
        "bathrooms": float(stay.bathrooms),
    }
    assert response.json() == expected
    for name in ["price", "rating", "bathrooms"]:
        assert isinstance(response.json()[name], (int, float))


def test_missing_stay_returns_404(populated_client):
    response = populated_client.get("/stays/missing-stay")
    assert response.status_code == 404
    assert response.json() == {"detail": "Stay not found"}


@pytest.mark.parametrize(
    "params",
    [
        {"guests": "0"},
        {"guests": "17"},
        {"guests": "invalid"},
        {"guests": "1.5"},
        {"category": "Unknown"},
        {"sort": "Unknown"},
        {"min_price": "-1"},
        {"max_price": "-1"},
        {"max_price": "NaN"},
        {"max_price": "Infinity"},
        {"min_price": "1.001"},
        {"max_price": "100000000"},
        {"min_price": "2000", "max_price": "1000"},
        {"destination": "x" * 101},
        {"destination": "bad\x00query"},
        {"unexpected": "parameter"},
    ],
)
def test_invalid_parameters_return_422(populated_client, params):
    response = populated_client.get("/stays", params=params)
    assert response.status_code == 422


def test_empty_database_returns_empty_list(db_client):
    assert _ids(db_client) == []


def test_request_session_commit_does_not_escape_outer_transaction(
    db_connection, db_engine
):
    stay = load_stays()[0].model_copy(update={"id": "commit-isolation-test"})
    with Session(
        bind=db_connection, join_transaction_mode="create_savepoint"
    ) as session:
        session.add(Stay(**stay.model_dump()))
        session.commit()
    assert db_connection.scalar(select(Stay.id).where(Stay.id == stay.id)) == stay.id
    with db_engine.connect() as other_connection:
        assert (
            other_connection.scalar(select(Stay.id).where(Stay.id == stay.id)) is None
        )
