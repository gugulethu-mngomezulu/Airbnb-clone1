from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


def test_health_does_not_connect_to_database_and_disposes_engine(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://test_user:test_password@127.0.0.1:1/test_stays",
    )
    with (
        patch("sqlalchemy.engine.Engine.dispose") as dispose,
        TestClient(app) as client,
    ):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    dispose.assert_called_once()
