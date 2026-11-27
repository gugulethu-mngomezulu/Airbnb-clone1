# Airbnb Clone

A South African stay discovery portfolio built with React 19, TypeScript, Vite and Tailwind CSS 4. The Python backend uses FastAPI, PostgreSQL 17, SQLAlchemy 2 and Alembic. A separate Node adapter supports optional Gemini search.

This is an independent demo, not affiliated with Airbnb. Listings, ratings, hosts and prices are fictional. Photos come from Unsplash and do not represent verified properties. There is no authentication, payment processing, booking or live availability.

## Current status

- The frontend supports search, filters, sorting, saved stays, property details and date-based price estimates.
- PostgreSQL has a migrated `stays` table and a seed fixture containing the same 20 stays as the frontend.
- FastAPI exposes `GET /health`, `GET /stays` and `GET /stays/{id}`. Stay filtering and sorting run in PostgreSQL. The health endpoint checks that the API is running, not database connectivity.
- The frontend fetches listings and detail pages from FastAPI, with loading, error and retry states. Saved IDs and date-based estimates stay in the browser. Mock listings are used only by tests.

## Requirements

- Ubuntu or WSL Ubuntu with Bash.
- Node.js 22.12+ and npm.
- Python 3.14 with `venv` and `ensurepip`, or the optional `uv` setup below.
- Docker with the Compose plugin. For WSL, enable Ubuntu integration in Docker Desktop and confirm `docker compose version` works inside Ubuntu.

Ports `5433` (PostgreSQL), `8011` (FastAPI) and `5180` (Vite) must be available. Do not stop unrelated services to free a port.

## Local setup

If you do not have a checkout yet:

```bash
git clone https://github.com/gugulethu-mngomezulu/Airbnb-clone1.git
cd Airbnb-clone1
```

Run the remaining commands from the repository root unless a step says otherwise.

### 1. Configure the environment

For a fresh clone:

```bash
cp -n .env.example .env
```

If `.env` already exists, keep it and add any missing settings from `.env.example`. Set `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`, then update `DATABASE_URL` to match them. Use the `postgresql+psycopg://` scheme and `127.0.0.1:5433` for the host and port. URL-encode any special characters in the URL's username and password.

For database tests, set `TEST_DATABASE_URL` to a separate database on the same PostgreSQL service, with a name ending in `_test`. The local setup uses `${POSTGRES_DB}_test`; keep its URL's username, password, host and port consistent with the database settings. Do not point it at your application database.

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
```

If your Python installation lacks `ensurepip` and you already have `uv`, use this command instead to create the environment with pip included:

```bash
uv venv --python 3.14 --seed api/.venv
```

Then activate it and install dependencies:

```bash
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
uvicorn app.main:app --reload --host 127.0.0.1 --port 8011
```

In another terminal:

```bash
curl --fail http://127.0.0.1:8011/health
```

Expected response: `{"status":"ok"}`. API documentation is available at http://127.0.0.1:8011/docs.

### 6. Run the frontend

In another terminal, from the repository root:

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5180. Keep FastAPI running in its own terminal. Vite forwards `/api/stays` requests to `127.0.0.1:8011`, removing the `/api` prefix. The more specific `/api/ai-search` route still goes to the Node adapter on port `8787`.

Ports `5180` and `8011` keep this project separate from other local services. Listing requests time out after ten seconds and can be retried. Filter changes cancel outdated requests. A network failure is shown as an error, not an empty result or a missing stay. There is no mock-data fallback.

When using WSL, install and run Node dependencies inside WSL. Do not reuse a `node_modules` directory installed on Windows: native packages such as Rollup are platform-specific.

## Stay API

With FastAPI running:

```bash
curl --fail http://127.0.0.1:8011/stays
curl --fail --get http://127.0.0.1:8011/stays \
  --data-urlencode 'destination=Cape Town' \
  --data-urlencode 'guests=4' \
  --data-urlencode 'category=Coastal' \
  --data-urlencode 'min_price=1000' \
  --data-urlencode 'max_price=3000' \
  --data-urlencode 'sort=price-low'
curl --fail http://127.0.0.1:8011/stays/atlantic-hideaway
```

`GET /stays` returns a JSON array. Each stay has the same fields as the frontend `Stay` type, including JSON numbers for price, rating and bathrooms.

| Query parameter | Default | Meaning |
| --- | --- | --- |
| `destination` | Empty | Case-insensitive substring search across name, location and province; up to 100 characters. |
| `guests` | `1` | Minimum guest capacity, from 1 to 16. |
| `category` | `All stays` | `Coastal`, `Cabins`, `City escapes`, `Countryside` or `Unique stays`. |
| `min_price` | `0` | Inclusive minimum nightly price. |
| `max_price` | No limit | Inclusive maximum nightly price. |
| `sort` | `recommended` | `recommended`, `price-low`, `price-high` or `rating`. |

Price bounds must be finite, non-negative values with at most eight whole-number digits and two decimal places. The minimum cannot exceed the maximum. Blank destination searches and `All stays` do not restrict results. Search characters such as `%` and `_` are treated literally, not as SQL wildcards.

`recommended` uses ID order, not a ranking algorithm. Price and rating sorts use ID as a tie-breaker. Saved-only filtering stays in the browser. Saved IDs are retained during loading, errors and filtered responses; a filtered result is not treated as the complete catalogue.

An unmatched search returns `[]`. A missing stay ID returns 404. Invalid query parameters, including unknown parameter names, return 422.

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
React + Vite (127.0.0.1:5180)
  |-- /api/stays* ---------------> FastAPI (127.0.0.1:8011)
  |                                  |-- GET /health
  |                                  |-- SQL filters and sorting
  |                                  `-- SQLAlchemy sessions
  |                                           |
  |                                           v
  |                                  PostgreSQL 17 (127.0.0.1:5433)
  |                                      ^                 ^
  |                                      |                 |
  |                                    Alembic          seed.py
  |                                                        ^
  |                                                        |
  |                                                fixtures/stays.json
  |-- saved IDs ----------------> browser local storage
  `-- optional /api/ai-search ---> Node adapter (127.0.0.1:8787)
                                      `--> Gemini API, when enabled
```

- `src/types.ts`: frontend data contracts.
- `src/components/`: browsing, property details and AI search UI.
- `src/lib/stays.ts`: pure filtering, date, pricing, grouping and saved-data helpers. Listing search and sorting use SQL; saved-only filtering stays local.
- `src/lib/stay-filters.ts`: shared categories and default filters, separate from test listings.
- `src/lib/stays-api.ts`: request URLs, response validation, cancellation and timeouts.
- `src/hooks/useStayResource.ts`: loading, retry and stale-response handling.
- `src/data/stays.ts`: test-only listing fixture; not imported by production code.
- `api/app/`: FastAPI app, environment settings, database sessions, Stay model, query validation and stay routes.
- `api/migrations/`: versioned PostgreSQL schema changes.
- `api/fixtures/stays.json`: the expanded 20-stay fixture.
- `api/seed.py`: validated, idempotent database seed.
- `api/tests/`: configuration, health, schema, migration, seed and endpoint tests, including real PostgreSQL integration tests.
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

With PostgreSQL running, create the test database once from the repository root:

```bash
docker compose exec postgres sh -c 'createdb --username="$POSTGRES_USER" --owner="$POSTGRES_USER" "${POSTGRES_DB}_test"'
```

Set `TEST_DATABASE_URL` in `.env` to this database. An existing test database does not need to be created again. Then, with the Python virtual environment active:

```bash
cd api
python -m pytest
ruff check .
ruff format --check .
alembic check
```

The database-backed tests require an explicit `TEST_DATABASE_URL`; they do not fall back to `DATABASE_URL`. The first database fixture applies Alembic migrations to the test database. Its name must end in `_test`, and its `stays` table must contain no persisted rows. If rows exist, the suite stops rather than deleting them.

Each database test runs inside an outer transaction that is rolled back afterward. API request sessions use savepoints, so even a session commit cannot persist test data. Seed and endpoint integration tests share this setup. The development database and its seeded stays are not used by these tests. `alembic check` in the command block above still checks the application database.

At desktop and mobile widths, check search, combined filters, sorting, saved-stay persistence, property navigation, date validation, keyboard access and the browser console. No reservation is created by the price estimate.

## Continuous integration

[CI](.github/workflows/ci.yml) runs on pushes and pull requests targeting `main`:

- Node 22 installs the lockfile and runs typecheck, lint, frontend/Node tests and the build.
- Python 3.14 runs Ruff, Alembic migrations, schema checks and pytest against a disposable PostgreSQL 17 service.

Actions are pinned to commit hashes and use read-only repository permissions. CI does not need application secrets, make live AI calls or deploy the project.

## Scope and review

The backend serves stay discovery. Accounts, reservation storage, live availability and payments are separate future work. Saved stays are browser-local, and price estimates do not create bookings.

See [the walkthrough](docs/FRONTEND_REVIEW.md) for request flow, browser checks and known limitations.

## Security notes

Potential credentials were found in the original Git commit. Removing files does not revoke keys or remove them from history. Rotate or revoke exposed credentials and review provider restrictions. This branch does not rewrite Git history.

Do not commit `.env`, virtual environments, `node_modules`, build output or caches.
