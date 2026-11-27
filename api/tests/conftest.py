import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import func, select
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.config import ENV_FILE, Settings
from app.database import create_db_engine, get_session
from app.main import app
from app.models import Stay

API_ROOT = Path(__file__).resolve().parents[1]


class DatabaseTestSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
        hide_input_in_errors=True,
    )

    test_database_url: SecretStr


@pytest.fixture(scope="session")
def db_engine():
    config = DatabaseTestSettings()
    settings = Settings(_env_file=None, database_url=config.test_database_url)
    url = make_url(settings.database_url.get_secret_value())
    if not url.database.endswith("_test"):
        pytest.fail(
            "TEST_DATABASE_URL must name a database ending in _test", pytrace=False
        )

    # Migrate only the explicit test URL without changing this process's environment.
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=API_ROOT,
        env={**os.environ, "DATABASE_URL": settings.database_url.get_secret_value()},
        check=True,
    )
    engine = create_db_engine(settings)
    try:
        with engine.connect() as connection:
            count = connection.scalar(select(func.count()).select_from(Stay))
            if count:
                pytest.fail(
                    "The test database must have no saved stays; data was not deleted",
                    pytrace=False,
                )
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def db_connection(db_engine):
    with db_engine.connect() as connection:
        transaction = connection.begin()
        try:
            yield connection
        finally:
            transaction.rollback()
            assert connection.scalar(select(func.count()).select_from(Stay)) == 0


@pytest.fixture
def db_client(db_connection):
    def override_session():
        with Session(
            bind=db_connection,
            join_transaction_mode="create_savepoint",
        ) as session:
            yield session

    previous = app.dependency_overrides.get(get_session)
    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            yield client
    finally:
        if previous is None:
            app.dependency_overrides.pop(get_session, None)
        else:
            app.dependency_overrides[get_session] = previous
