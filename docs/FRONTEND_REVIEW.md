# Frontend and API walkthrough

## Request flow

```text
Search, category, guest, budget or sort change
  -> src/App.tsx
  -> buildStaysUrl
  -> /api/stays through Vite
  -> FastAPI query validation
  -> SQLAlchemy WHERE and ORDER BY
  -> PostgreSQL
  -> validated JSON response
  -> property cards
```

A property link uses hash navigation and fetches `/api/stays/{id}`. Vite removes the `/api` prefix before forwarding stay requests to FastAPI. The more specific `/api/ai-search` proxy remains separate.

## Code map

- `src/types.ts`: stay, filter and date contracts used by the UI.
- `src/lib/stay-filters.ts`: categories and default filter values.
- `src/lib/stays-api.ts`: URL encoding, JSON validation, safe errors and a ten-second request timeout.
- `src/hooks/useStayResource.ts`: request state, cancellation and retries. Aborted responses cannot replace newer results.
- `src/App.tsx`: applied filters, hash navigation, saved IDs and page selection.
- `src/components/StayRequestState.tsx`: accessible loading and error messages with a retry action.
- `api/app/schemas.py`: query validation and response fields.
- `api/app/stays.py`: SQL filtering, sorting and detail lookup.
- `api/app/database.py`: engine and request-session setup.
- `api/migrations/`: versioned schema changes.
- `api/seed.py`: validates the fixture and inserts missing stay IDs in one transaction.

The runtime frontend does not import `src/data/stays.ts`. It remains a fixture for helper and component tests. The database seed uses `api/fixtures/stays.json`.

## Loading and failures

Listing and detail requests have separate state. Loading does not show an empty-result or missing-stay message. Failed requests show a safe error and an explicit retry action. A detail response with HTTP 404 shows the missing-stay page.

Requests use abort signals when the query or route changes. Responses are also checked against their request key, so a slow old search cannot replace the current results. API payloads are validated before rendering; numeric strings and malformed rows are rejected.

## Saved stays and estimates

Saved IDs use the existing browser local-storage key. IDs are retained while data loads, during failures and across filtered responses. A filtered response is not a complete catalogue and must not be used to discard other saved IDs.

Saved-only filtering happens in the browser after SQL search results arrive. If local storage fails, saves remain in memory with a warning. Saves are not tied to an account or shared between devices.

Date edits in the search dialog remain pending until Apply. Applied dates and guest choices pass to the detail view. The pure helpers in `src/lib/stays.ts` validate dates and calculate the fictional cleaning and service fees. Estimates do not check availability, create reservations or charge money.

## Optional AI search

The Node adapter extracts suggested filters, not listings. The user reviews and confirms those filters before they become a normal FastAPI search. Keys stay on the server.

The adapter accepts only the local development and preview origins. Provider access, model quality and billing have not been verified with a live call. Tests use mocks. See [Gemini setup](GEMINI_SETUP.md) for configuration and limits.

## Tests

From the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

From `api/`, with the virtual environment active:

```bash
python -m pytest
ruff check .
ruff format --check .
alembic check
```

Database-backed tests require the separate `TEST_DATABASE_URL` documented in the [README](../README.md). The test database name must end in `_test`. Fixtures run migrations there and roll back each test. Savepoints prevent a request-session commit from escaping the test transaction. Existing saved rows cause the suite to stop rather than delete data.

Browser checks at desktop width 1280 and mobile width 390 cover:

- Search, combined filters, sorting and saved-only results.
- Saved IDs across reloads and filtered responses.
- Direct detail links, browser navigation and date transfer.
- Matching card/detail price estimates.
- Delayed responses, malformed data, errors, retries and 404s.
- Old requests completing after a newer search.
- Confirmed mocked AI filters reaching the real SQL endpoint.
- Horizontal overflow, image loading and the keyboard skip link.

These browser checks are manual verification, not part of `npm test`. Other browser engines, real devices and a full screen-reader audit remain untested. HTTP 500/404 console entries are expected during failure-path tests; ordinary browsing showed no JavaScript errors.

## Known limitations

- This is a stay-discovery demo, not a complete booking platform. Authentication, reservation storage, live availability and payments are not implemented.
- The seven moderate npm advisories are in the development linting dependency tree. The production-only audit reported zero findings. Dependency maintenance needs a separately approved update.
- The Python test client emits an HTTPX deprecation warning. Tests still pass.
- Photos are external, illustrative and may repeat. A local placeholder handles image failures.
- Potential credentials remain in the original Git history. Rotate or revoke any real exposed keys. Removing files does not revoke credentials; this work does not rewrite history.
- Public deployment and production security have not been approved or verified.
