# Airbnb Clone

A South African stay discovery portfolio built with React 19, TypeScript, Vite and Tailwind CSS 4. The Python backend uses FastAPI, PostgreSQL 17, SQLAlchemy 2 and Alembic. A separate Node adapter supports optional Gemini search.

This is an independent demo, not affiliated with Airbnb. Listings, ratings, hosts and prices are fictional. Photos come from Unsplash and do not represent verified properties. There is no authentication, payment processing, booking or live availability.

## Current status

- The frontend supports search, filters, sorting, saved stays, property details and date-based price estimates.
- PostgreSQL has a migrated `stays` table and a seed fixture containing the same 20 stays as the frontend.
- FastAPI currently exposes `GET /health`. It checks that the API is running, not database connectivity.
- Stay endpoints and frontend API integration are not implemented yet. The frontend still reads `src/data/stays.ts` and filters locally.

## Requirements

- Ubuntu or WSL Ubuntu with Bash.
- Node.js 22.12+ and npm.
- Python 3.14, which is the version tested locally, with `venv` and pip available.
- Docker with the Compose plugin. For WSL, enable Ubuntu integration in Docker Desktop and confirm `docker compose version` works inside Ubuntu.

Run the following commands from the repository root unless a step says otherwise.

## Local setup

### 1. Configure the environment

For a fresh clone:

```bash
cp -n .env.example .env
```

If `.env` already exists, keep it and add any missing settings from `.env.example`. Set `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`, then update `DATABASE_URL` to match them. Use the `postgresql+psycopg://` scheme and `127.0.0.1:5433` for the host and port. URL-encode any special characters in the URL's username and password.

Keep `GEMINI_ENABLED=false` unless you intend to use the optional AI search. A Gemini key is not needed for the database or regular browsing.

`.env` is ignored by Git. `.env.example` contains placeholders only. Never put database credentials or API keys in frontend code or variables prefixed with `VITE_`.

### 2. Start PostgreSQL

```bash
docker compose config --quiet
docker compose up -d --wait postgres
docker compose ps postgres
```

PostgreSQL is exposed only on `127.0.0.1:5433`. It uses port `5432` inside its container. The named volume keeps database data between container restarts. The healthcheck waits for PostgreSQL to accept connections.

The first migration enables `pg_trgm` for substring-search indexing. The database user needs permission to create that extension; the local Compose user has it.

### 3. Install Python dependencies

```bash
python3 -m venv api/.venv
source api/.venv/bin/activate
python -m pip install -r api/requirements-dev.txt
```

The development requirements include the runtime dependencies, pytest and Ruff. Dependencies are installed into the virtual environment, not system Python.

### 4. Migrate and seed

With the virtual environment active:

```bash
cd api
alembic upgrade head
alembic check
python seed.py
```

The seed validates the JSON fixture and inserts all rows in one transaction. Running it again skips existing IDs and preserves local edits. It does not overwrite or delete stays.

### 5. Run FastAPI

From `api/`, with the virtual environment active:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
curl --fail http://127.0.0.1:8000/health
```

Expected response: `{"status":"ok"}`. API documentation is available at http://127.0.0.1:8000/docs.

### 6. Run the frontend

In another terminal, from the repository root:

```bash
npm ci
npm run dev
```

Open the address printed by Vite, normally http://127.0.0.1:5173. The frontend currently works without FastAPI because it still uses local listing data.

When using WSL, install and run Node dependencies inside WSL. Do not reuse a `node_modules` directory installed on Windows: native packages such as Rollup are platform-specific.

## Optional Gemini search

The Node adapter runs separately from FastAPI. Add a server-only `GEMINI_API_KEY` to your local `.env`, choose `GEMINI_MODEL`, and set `GEMINI_ENABLED=true` only after checking quota and billing.

From the repository root:

```bash
npm run dev:api
```

This command starts the Gemini adapter on `127.0.0.1:8787`, not the Python API. Vite proxies `/api/ai-search` to it. In the UI, use **Try AI search**, submit a description, review the suggested filters, and apply them.

Regular browsing does not call Gemini. Automated adapter tests mock provider responses and do not use paid API calls. See [docs/GEMINI_SETUP.md](docs/GEMINI_SETUP.md) for details.

## Architecture

```text
Browser
  |
  v
React + Vite (127.0.0.1:5173)
  |-- listings and local filters --> src/data/stays.ts + src/lib/stays.ts
  |-- saved IDs -----------------> browser local storage
  `-- optional /api/ai-search ---> Node Gemini adapter (127.0.0.1:8787)
                                      `--> Gemini API, when enabled

FastAPI (127.0.0.1:8000, not connected to the frontend yet)
  |-- GET /health
  `-- SQLAlchemy engine/session setup
              |
              v
      PostgreSQL 17 (127.0.0.1:5433)
          ^                 ^
          |                 |
   Alembic migrations   seed.py <-- fixtures/stays.json
```

- `src/types.ts`: frontend data contracts.
- `src/components/`: browsing, property details and AI search UI.
- `src/lib/stays.ts`: pure filtering, date, pricing and saved-data helpers.
- `api/app/`: FastAPI app, environment settings, database sessions and Stay model.
- `api/migrations/`: versioned PostgreSQL schema changes.
- `api/fixtures/stays.json`: the expanded 20-stay fixture.
- `api/seed.py`: validated, idempotent database seed.
- `api/tests/`: configuration, health, schema, migration and seed tests.
- `server/`: optional Gemini adapter and mocked tests.

Hash-based property navigation does not require server-side route rewrites. The SQLAlchemy engine is created at API startup and disposed on shutdown. Database sessions are closed after each request that uses the session dependency.

## Checks

From the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

With PostgreSQL running and the Python virtual environment active:

```bash
cd api
python -m pytest
ruff check .
ruff format --check .
alembic check
```

The seed integration test uses the configured database with a transaction rollback. Its temporary rows are not committed. Run migrations before running the Python suite.

At desktop and mobile widths, check search, combined filters, sorting, saved-stay persistence, property navigation, date validation, keyboard access and the browser console. No reservation is created by the price estimate.

## Security notes

Potential credentials were found in the original Git commit. Removing files does not revoke keys or remove them from history. Rotate or revoke exposed credentials and review provider restrictions. This branch does not rewrite Git history.

Do not commit `.env`, virtual environments, `node_modules`, build output or caches.
