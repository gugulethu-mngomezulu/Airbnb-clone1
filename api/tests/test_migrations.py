from io import StringIO
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import Index, literal_column
from sqlalchemy.dialects.postgresql import dialect
from sqlalchemy.schema import CreateIndex, CreateTable

from app.models import Stay

API_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def migration_config(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://test_user:test_password@127.0.0.1:1/test_stays",
    )
    output = StringIO()
    config = Config(str(API_ROOT / "alembic.ini"), output_buffer=output)
    return config, output


def test_offline_upgrade_includes_model_table_indexes_and_extension(migration_config):
    config, output = migration_config
    command.upgrade(config, "head", sql=True)
    sql = output.getvalue()
    assert "CREATE EXTENSION IF NOT EXISTS pg_trgm" in sql
    assert "CREATE TABLE stays" in sql
    assert "test_password" not in sql
    model_sql = str(CreateTable(Stay.__table__).compile(dialect=dialect()))
    # Compare definitions while ignoring whitespace and the primary key name.
    for definition in model_sql.splitlines():
        definition = definition.strip().rstrip(",")
        if definition and not definition.startswith(
            ("CREATE TABLE", "PRIMARY KEY", ")")
        ):
            assert definition in sql
    for index in Stay.__table__.indexes:
        assert str(CreateIndex(index).compile(dialect=dialect())) in sql


def test_search_index_matches_postgresql_reflected_grouping():
    reflected = Index(
        "ix_stays_search",
        literal_column(
            "((((name::text || ' '::text) || location::text) || ' '::text) "
            "|| province::text)"
        ),
        postgresql_using="gin",
    )
    model_index = next(
        index for index in Stay.__table__.indexes if index.name == "ix_stays_search"
    )
    context = MigrationContext.configure(dialect_name="postgresql")
    result = context.impl.compare_indexes(model_index, reflected)
    assert result.is_equal, result.message


def test_offline_downgrade_keeps_shared_extension(migration_config):
    config, output = migration_config
    command.downgrade(config, "head:base", sql=True)
    sql = output.getvalue()
    assert "DROP TABLE stays" in sql
    assert "DROP EXTENSION" not in sql
    assert "DROP INDEX ix_stays_search" in sql
