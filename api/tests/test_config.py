import pytest
from pydantic import ValidationError

from app.config import Settings

DATABASE_URL = "postgresql+psycopg://test_user:test_password@127.0.0.1/test_stays"


def test_reads_database_url_from_environment(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)
    settings = Settings(_env_file=None)
    assert settings.database_url.get_secret_value() == DATABASE_URL
    assert "test_password" not in repr(settings)


def test_reads_env_file_and_ignores_other_service_settings(tmp_path, monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text(
        f"DATABASE_URL={DATABASE_URL}\nPOSTGRES_DB=test_stays\nGEMINI_ENABLED=false\n"
    )
    assert Settings(_env_file=env_file).database_url.get_secret_value() == DATABASE_URL


def test_requires_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


@pytest.mark.parametrize(
    "url",
    [
        "",
        "not-a-url",
        "sqlite:///test.db",
        "postgresql://user:password@localhost/stays",
        "postgresql+psycopg://user:password@localhost",
        "postgresql+psycopg:///stays",
        "postgresql+psycopg://user:password@localhost:invalid/stays",
    ],
)
def test_rejects_invalid_database_urls(url):
    with pytest.raises(ValidationError) as error:
        Settings(_env_file=None, database_url=url)
    if url:
        assert url not in str(error.value)
