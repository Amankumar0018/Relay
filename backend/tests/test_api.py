import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from fastapi.testclient import TestClient

from app.core.database import check_db_connection, engine


def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert data["docs_url"] == "/docs"


def test_read_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert "environment" in data
    assert "version" in data


def test_read_health_unhealthy(monkeypatch, client: TestClient):
    # Simulate database connection failure
    monkeypatch.setattr("app.api.endpoints.check_db_connection", lambda: False)
    response = client.get("/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "unhealthy"
    assert data["database"] == "disconnected"
    assert "environment" in data
    assert "version" in data


def test_database_connection():
    assert check_db_connection() is True


def test_sqlite_foreign_keys_enforced(db_session):
    """Verifies that SQLite raises an IntegrityError on foreign key constraint violations."""
    db_session.execute(text("CREATE TABLE test_parent (id INTEGER PRIMARY KEY);"))
    db_session.execute(
        text("CREATE TABLE test_child (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES test_parent(id));")
    )
    db_session.commit()

    with pytest.raises(IntegrityError):
        db_session.execute(text("INSERT INTO test_child (id, parent_id) VALUES (1, 999);"))
        db_session.commit()


def test_dev_database_isolation(db_session):
    """Verifies that test operations do not contaminate or modify the development database."""
    db_session.execute(text("CREATE TABLE test_isolation_marker (id INTEGER PRIMARY KEY);"))
    db_session.commit()

    # The table must exist in the isolated test session
    test_result = db_session.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' AND name='test_isolation_marker';")
    ).fetchall()
    assert len(test_result) == 1

    # The table must NOT exist in the development engine/database
    with engine.connect() as dev_conn:
        dev_result = dev_conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='test_isolation_marker';")
        ).fetchall()
        assert len(dev_result) == 0


def test_dev_engine_pragmas():
    """Verifies that the development engine activates foreign keys and WAL mode."""
    with engine.connect() as conn:
        fk_status = conn.execute(text("PRAGMA foreign_keys;")).scalar()
        assert fk_status == 1

        journal_mode = conn.execute(text("PRAGMA journal_mode;")).scalar()
        assert journal_mode.lower() == "wal"


def test_lifespan_production_fail_fast(monkeypatch):
    """Verifies that startup fails fast with RuntimeError in production if DB init fails."""
    from app.main import lifespan, app
    from app.core.config import settings
    import pytest

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    def fail_init():
        raise ConnectionError("Simulated PostgreSQL connection failure")
    monkeypatch.setattr("app.main.init_db", fail_init)

    with pytest.raises(RuntimeError, match="CRITICAL: Application failed to initialize database in production"):
        import asyncio
        async def run_lifespan():
            async with lifespan(app):
                pass
        asyncio.run(run_lifespan())
