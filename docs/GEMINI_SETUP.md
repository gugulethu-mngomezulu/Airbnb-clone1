# Gemini AI stay finder — local setup and review

## What it does

A user describes a stay. Gemini extracts **destination, guest count, nightly ZAR budget, and category**. Both backend and frontend validate the response. The UI shows suggested filters; nothing changes until the user clicks **Apply AI filters**.

The existing local filtering code selects from the 20 fictional listings. Gemini never supplies property IDs, prices, booking links, executable code, or verified availability.

Dates, amenities, quietness, accessibility, safety, distances and non-ZAR/total-trip budgets are not supported by AI filtering. The model is instructed to list unsupported requirements; the UI warns that they were not checked or applied. Extraction can still misinterpret a request, so review the proposed filters. Date-picker selections remain separate.

## Add your key safely

The project root has an ignored `.env`. It was created with a blank key and AI disabled. Edit it locally in VS Code:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_ENABLED=true
```

Use a model available to your Google AI Studio project. Do not paste a key into chat, screenshots, source files, browser code, or a `VITE_*` variable. Never commit `.env*` files. A local `.env.example` was initially created without a key, but it is also ignored under this project's no-`.env*`-commits rule. Use the documented example above when setting up a fresh clone.

Use one clean `GEMINI_ENABLED=true` assignment. If the setting is malformed, correct only that line locally and leave the key untouched. A one-session shell override also works, because shell variables take precedence; it does not repair the file for future restarts.

Setting `GEMINI_ENABLED=true` and clicking **Find with Gemini** permits a real provider request. If your project has billing enabled, charges may apply. Adding a key does not guarantee free quota. Do not enable it until you have checked project access, limits and billing.

## Run locally

Use Node 22.12+; development was tested with Node 24.15.

Terminal 1:

```powershell
cd C:\Users\User\Airbnb-clone1
npm run dev:api
```

Terminal 2:

```powershell
cd C:\Users\User\Airbnb-clone1
npm run dev
```

Open http://127.0.0.1:5173. If the frontend is already running, reuse it rather than starting another copy. The API binds only to **127.0.0.1:8787**. Ports are fixed; development and preview fail rather than silently move to unsupported ports.

After editing `.env`, stop the API with Ctrl+C and run `npm run dev:api` again. Node's watch mode does not guarantee a reload for environment-file changes. Shell environment variables take precedence over the env file.

To disable real calls, set `GEMINI_ENABLED=false` and restart the API. Regular search works without the API or a key.

## Model and API contract

- Configurable model, default: **gemini-3.5-flash-lite**.
- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- Authentication: server-only `x-goog-api-key` header, never a query string.
- Prompt and JSON schema: `server/prompt.mjs`.
- JSON generation configuration uses `responseFormat.text` with `APPLICATION_JSON`, matching Google's current generateContent structured-output documentation.
- The original generateContent API remains supported; Google's newer recommended interface for new projects is the Interactions API. This small stateless integration deliberately uses the documented generateContent REST contract.
- No Google SDK or other new dependency was installed.

Current documentation consulted:
- https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- https://ai.google.dev/gemini-api/docs/text-generation?generate-content=true
- https://ai.google.dev/gemini-api/docs/structured-output?generate-content=true
- https://ai.google.dev/gemini-api/docs/interactions
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/pricing

A live request has **not** been made or approved as part of implementation. Mocked tests prove our code paths, not your account's access or the real model's extraction accuracy.

## Limits and errors

| Guardrail | Local behaviour |
| --- | --- |
| User input | 1–800 trimmed characters; request body at most 4096 bytes |
| Request origins/host | Local Vite/preview origins and local API host only; no wildcard CORS |
| Concurrency | One provider request in flight |
| Local rate | Five new AI searches per minute, shared by this API process |
| Daily ceiling | Twenty provider-call attempts per UTC day, shared by this process |
| Retries | At most two provider attempts, only retrying HTTP 5xx once |
| Provider 429 | Stops immediately; shows quota/rate-limit error and Retry-After when available |
| Cache | Same trimmed prompt reused for five minutes; bounded in memory; key is a SHA-256 digest |
| Timeout | 10 seconds per provider attempt; 25-second client timeout |
| Output | 1024 maximum output tokens; response body capped at 64 KiB; strict schema validation |
| Logging | Only fixed error code/status metadata, never key, prompt, raw exception or provider error body |

Failed calls and retries consume the local attempt budget. Local counters/cache reset when the API process restarts: **this is not a persistent billing cap or provider quota monitor**. A cancelled browser request may already have reached Google and still consume quota. The server can finish it within its bounded timeout.

Google's quota applies per project, not per API key. Request-per-day quotas reset at midnight Pacific time; minute/token limits have different windows. Our separate local daily counter uses UTC. Never rotate keys to try to bypass quota. Check actual limits in Google AI Studio.

Free-tier data handling can differ from paid-tier handling. Review Google's current terms before sending any private information.

## Code flow

`AiSearch.tsx → requestAiSearch → Vite proxy → server/http.mjs → server/ai.mjs → Gemini → strict JSON validation → suggested filters → Apply AI filters → filterStays`

- `server/index.mjs`: reads environment variables and binds the loopback server.
- `server/http.mjs`: host/origin, body limits, timeouts and safe HTTP errors.
- `server/prompt.mjs`: one place for system instructions and JSON schema.
- `server/ai.mjs`: provider call, validation, cache and quota guardrails.
- `src/lib/ai.ts`: validates browser responses, maps safe error messages and constructs frontend filters.
- `src/components/AiSearch.tsx`: opt-in prompt form, loading/cancel, review and apply.

## Code-review lessons

1. **Trust boundaries:** input validation and secret protection belong on the server, not only in TypeScript types.
2. **AI is not authoritative:** validate every output field and show criteria before applying them.
3. **Preserve intent:** support guest counts up to 16 and low/high budgets without silently clamping them to old UI limits. An oversized group can correctly return no homes.
4. **Cost limits:** count retries too; do not repeatedly retry exhausted quota.
5. **Async races:** disable prompt editing while loading and prevent cancelled/old results from updating the UI.
6. **Scope:** this is a new optional local API, not a restoration of the removed authentication/payment backend.

## Tests

```powershell
npm run typecheck
npm run lint
npm test
npm run build
git check-ignore .env
```

Current automated result: **72 frontend/helper/static-render tests and 26 backend tests**, all mocked for the provider. Native HTTP tests call only ephemeral loopback servers, never Google.

Browser checks at 1280px and 390px:
- Real local API forced disabled: setup error shown, zero provider calls.
- Mock success: review first, then apply; only existing stays returned.
- Mock quota and invalid output: clear safe messages; prior filters preserved.
- Loading/cancellation: no stale suggestion applied.
- Low budget: honest empty results, budget slider stays consistent.
- Mobile AI panel and detail page: no horizontal overflow.
- Expected HTTP 503/429 browser console entries occur during disabled/quota tests; no JavaScript page errors.
- Live Gemini quality, account access, quota and billing were not tested.

## Security findings and deployment limits

**High — historical potential Stripe credential:** Gitleaks found a Stripe access-token pattern in the original commit `19ef33d1`, `server.js:7`. Revoke/rotate it if real. It was deleted from the working tree, not from Git history.

**Review needed — historical Google API key:** the same commit's `firebase.js:5` contains a Google API-key pattern. Firebase browser API keys can be public identifiers; verify key restrictions, Firebase Security Rules and unintended API access. Do not assume deletion revoked it.

No secret values were printed. Gitleaks found no leaks in current `src/` or `server/`. Both `.env` and `.env.example` are ignored and excluded from commits. Automated scanners are not proof that no secrets exist.

Existing moderate development-tool dependency findings and ESLint support warnings remain. No dependency upgrade or Git-history rewrite was performed.

This loopback demo has **no authentication or durable/distributed limits**. Do not expose it publicly or deploy it as-is. A public service needs authentication, authorization, durable per-user budgeting, production hosting controls, privacy review and independent security review.
