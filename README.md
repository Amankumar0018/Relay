# Relay

Hackathon project monorepo.

## Architecture

- **Frontend**: Next.js with TypeScript (scaffold pending backend verification)
- **Backend**: FastAPI with Python 3.12 (containerized)
- **Database**: SQLite with SQLAlchemy & Alembic
- **Orchestration**: Docker Compose

## Project Layout

```text
Relay/
├── frontend/             # Next.js frontend application
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/          # API route definitions
│   │   ├── core/         # Settings, database engine, error handlers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Test suite
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

## Running the Backend via Docker Compose

```bash
docker compose up --build
```

The API will be available at `http://localhost:8000`:
- Root: `GET http://localhost:8000/`
- Health check: `GET http://localhost:8000/health`
- OpenAPI Docs: `http://localhost:8000/docs`

