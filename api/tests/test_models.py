import pytest
from sqlalchemy import Numeric, Text
from sqlalchemy.dialects.postgresql import ARRAY, dialect
from sqlalchemy.schema import CreateIndex, CreateTable

from app.models import Stay


def test_stay_columns_match_frontend_contract():
    assert set(Stay.__table__.columns.keys()) == {
        "id",
        "name",
        "location",
        "province",
        "category",
        "description",
        "price",
        "rating",
        "reviews",
        "guests",
        "bedrooms",
        "beds",
        "bathrooms",
        "image",
        "gallery",
        "tag",
        "host",
        "amenities",
    }
    assert all(not column.nullable for column in Stay.__table__.columns)
    assert list(Stay.__table__.primary_key.columns.keys()) == ["id"]


@pytest.mark.parametrize(
    ("name", "precision", "scale"),
    [("price", 10, 2), ("rating", 3, 2), ("bathrooms", 4, 1)],
)
def test_decimal_columns_preserve_precision(name, precision, scale):
    column_type = Stay.__table__.columns[name].type
    assert isinstance(column_type, Numeric)
    assert (column_type.precision, column_type.scale) == (precision, scale)


@pytest.mark.parametrize("name", ["gallery", "amenities"])
def test_string_lists_use_postgresql_text_arrays(name):
    column_type = Stay.__table__.columns[name].type
    assert isinstance(column_type, ARRAY)
    assert isinstance(column_type.item_type, Text)


def test_filter_and_sort_indexes():
    indexes = {index.name: index for index in Stay.__table__.indexes}
    for name in ["category", "guests", "price", "rating"]:
        assert list(indexes[f"ix_stays_{name}"].columns.keys()) == [name]
    search_sql = str(CreateIndex(indexes["ix_stays_search"]).compile(dialect=dialect()))
    assert "USING gin" in search_sql
    assert "gin_trgm_ops" in search_sql
    assert "(((name || ' ') || location) || ' ') || province" in search_sql


def test_database_checks_cover_category_and_numeric_bounds():
    sql = str(CreateTable(Stay.__table__).compile(dialect=dialect()))
    for name in [
        "category",
        "price",
        "rating",
        "reviews",
        "guests",
        "bedrooms",
        "beds",
        "bathrooms",
    ]:
        assert f"CONSTRAINT ck_stays_{name} CHECK" in sql
    assert "'All stays'" not in sql
    assert "rating >= 0 AND rating <= 5" in sql
