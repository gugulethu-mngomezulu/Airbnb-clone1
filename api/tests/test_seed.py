import json
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import dialect

from app.config import Settings
from app.database import create_db_engine
from app.models import Stay
from seed import FIXTURE_PATH, load_stays, main, seed_stays


@pytest.fixture
def seed_connection():
    engine = create_db_engine(Settings())
    try:
        with engine.connect() as connection:
            transaction = connection.begin()
            try:
                yield connection
            finally:
                transaction.rollback()
    finally:
        engine.dispose()


def test_fixture_contains_all_twenty_stays_and_model_fields():
    stays = load_stays()
    assert len(stays) == 20
    assert len({stay.id for stay in stays}) == 20
    assert {stay.category for stay in stays} == {
        "Coastal",
        "Cabins",
        "City escapes",
        "Countryside",
        "Unique stays",
    }
    for stay in stays:
        assert set(stay.model_dump()) == set(Stay.__table__.columns.keys())
    assert stays[0].id == "atlantic-hideaway"
    assert stays[-1].id == "midlands-cabin"
    assert stays[0].rating == Decimal("4.98")
    assert stays[-1].bedrooms == 1
    assert all("?auto=format&fit=crop&w=1000&q=85" in stay.image for stay in stays)


def test_fixture_path_does_not_depend_on_working_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert len(load_stays()) == 20


@pytest.mark.parametrize(
    "changes",
    [
        {"id": ""},
        {"id": "a" * 101},
        {"category": "All stays"},
        {"price": -1},
        {"price": 123.456},
        {"rating": 5.01},
        {"guests": 0},
        {"guests": 32768},
        {"reviews": True},
        {"bathrooms": 1.25},
        {"gallery": [123]},
        {"unexpected": "field"},
    ],
)
def test_rejects_invalid_fixture_rows(tmp_path, changes):
    row = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))[0]
    row.update(changes)
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps([row]), encoding="utf-8")
    with pytest.raises(ValidationError):
        load_stays(path)


@pytest.mark.parametrize("contents", ["[]", "{}", "not JSON"])
def test_rejects_empty_or_malformed_fixture(tmp_path, contents):
    path = tmp_path / "invalid.json"
    path.write_text(contents, encoding="utf-8")
    with pytest.raises(ValidationError):
        load_stays(path)


def test_rejects_duplicate_fixture_ids(tmp_path):
    row = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))[0]
    path = tmp_path / "duplicate.json"
    path.write_text(json.dumps([row, row]), encoding="utf-8")
    with pytest.raises(ValueError, match="duplicate stay IDs"):
        load_stays(path)


def test_seed_uses_parameterized_conflict_handling():
    connection = MagicMock()
    connection.execute.return_value.scalars.return_value.all.return_value = ["new-id"]
    assert seed_stays(connection, load_stays()[:1]) == 1
    statement = connection.execute.call_args.args[0]
    sql = str(statement.compile(dialect=dialect()))
    assert "ON CONFLICT (id) DO NOTHING" in sql
    assert "RETURNING stays.id" in sql
    assert "The Atlantic Hideaway" not in sql


def test_empty_seed_does_not_execute_sql():
    connection = MagicMock()
    assert seed_stays(connection, []) == 0
    connection.execute.assert_not_called()


def test_main_validates_before_creating_engine():
    with (
        patch("seed.load_stays", side_effect=ValueError("invalid fixture")),
        patch("seed.create_db_engine") as create_engine,
        pytest.raises(ValueError, match="invalid fixture"),
    ):
        main()
    create_engine.assert_not_called()


def test_main_rolls_back_and_disposes_engine_on_failure():
    engine = MagicMock()
    with (
        patch("seed.Settings"),
        patch("seed.create_db_engine", return_value=engine),
        patch("seed.seed_stays", side_effect=RuntimeError("insert failed")),
        pytest.raises(RuntimeError, match="insert failed"),
    ):
        main()
    assert engine.begin.return_value.__exit__.call_args.args[0] is RuntimeError
    engine.dispose.assert_called_once()


def test_seed_is_idempotent_and_preserves_existing_edits(seed_connection):
    stay = load_stays()[0].model_copy(update={"id": f"seed-test-{uuid4().hex}"})
    assert seed_stays(seed_connection, [stay]) == 1
    seed_connection.execute(
        update(Stay).where(Stay.id == stay.id).values(name="Existing local edit")
    )
    assert seed_stays(seed_connection, [stay]) == 0
    assert (
        seed_connection.scalar(
            select(func.count()).select_from(Stay).where(Stay.id == stay.id)
        )
        == 1
    )
    saved = (
        seed_connection.execute(select(Stay.__table__).where(Stay.id == stay.id))
        .mappings()
        .one()
    )
    assert saved["name"] == "Existing local edit"
    assert saved["rating"] == stay.rating
    assert saved["gallery"] == stay.gallery
    assert saved["amenities"] == stay.amenities
