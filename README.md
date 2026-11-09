# Airbnb Clone — frontend and optional Gemini finder

An **Airbnb.co.za-inspired** South African stay discovery portfolio, rebuilt with **React 19, TypeScript, Vite, and Tailwind CSS 4**. The design uses a coral-accented header, rounded search, destination carousels and compact property cards, with Airbnb Clone branding and an explicit independent-demo disclaimer.

## Run locally

Use Node.js 22.12+ or a supported newer LTS release and npm. From PowerShell:

```powershell
cd C:\Users\User\Airbnb-clone1
npm ci
npm run dev
```

Open the local address printed by Vite (normally http://127.0.0.1:5173). If dependencies are already installed, just run `npm run dev`.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The project uses strict TypeScript, ESLint, Vitest and Node's built-in test runner. The 98 automated tests (72 frontend/helper/static-render, 26 backend) use mocked Gemini responses; no live AI request is made. Browser interactions are checked separately.

## Optional Gemini setup

A blank, Git-ignored `.env` was created with `GEMINI_API_KEY=`, `GEMINI_MODEL=gemini-3.5-flash-lite` and `GEMINI_ENABLED=false`. Add your key locally and explicitly enable it only after checking your project's quota and billing. Never use a `VITE_` prefix or share the key in chat.

Start the local API in a separate terminal with `npm run dev:api`. The frontend uses Vite's proxy to reach it on loopback port 8787. Use **Try AI search → Find with Gemini → review → Apply AI filters**. Regular search does not need a key or the API.

See **[docs/GEMINI_SETUP.md](docs/GEMINI_SETUP.md)** for exact setup, model/API details, limits, privacy, testing and security findings. Live Gemini access has not been tested.

## Frontend features

- Search-first responsive browsing page with 20 fictional South African stays.
- Destination rows with scroll controls; category/search/sort selections switch to a filtered grid.
- Destination/name/province search, guest capacity, category and price filters.
- Sorting by nightly price or rating.
- Saved stays in this browser's local storage; gracefully degrades to session-only state when storage fails.
- Hash-based property detail links, example photo gallery, amenities and mock hosts.
- Search date dialog with Apply/Clear and cancellation behaviour; date/guest choices transfer to property details.
- Date-based cost estimate with shared 1–30-night validation, fictional cleaning fee and 8% service fee. Cards show nightly prices without dates, or full example totals with dates.
- Mobile bottom navigation, an accessible navigation disclosure, and host/currency demo information dialogs. Experiences and services are explicitly unavailable.
- Empty states, missing-route page, keyboard focus styles, reduced-motion styles and image fallback.
- Optional Gemini filter extraction with explicit confirmation, safe errors and normal-search fallback.

All listings, ratings, hosts and prices are **mock data**. Photography is illustrative and loaded from Unsplash, not verified images of actual properties. External images require connectivity; failures show a local placeholder. No live availability is checked.

## Structure

- `index.html` → `src/main.tsx` → `src/App.tsx`: entry and page coordination.
- `src/components/`: shared UI, property cards and details.
- `src/data/stays.ts`: typed fictional listings.
- `src/types.ts`: shared data contracts.
- `src/lib/stays.ts`: pure search, date, pricing and saved-data helpers.
- `src/lib/stays.test.ts`: unit tests.
- `src/styles.css`: Tailwind import, design tokens and component styling.
- `src/components/AiSearch.tsx`, `src/lib/ai.ts`: opt-in AI UI and validated filter application.
- `server/`: new loopback-only Gemini adapter, prompt/schema and mocked tests.

Hash navigation avoids server rewrite requirements. Vite loads the `src/` entry. The 38 unused root-level legacy JavaScript/CSS files—including the old backend, Firebase, login and payment code—were removed with approval. Their committed versions remain recoverable from Git history.

## Scope and safety

The frontend now has an optional **local-only Gemini API adapter**. There is no authentication, real booking, payment integration, or public deployment. Gemini receives a user description only when AI is enabled and explicitly submitted. Never put API keys into client-side code. Deleting legacy files does not remove their contents from Git history or revoke credentials.

**Security warning:** a redacted history scan found potential credentials in the original commit's `server.js:7` (Stripe token) and `firebase.js:5` (Google API key). Revoke/rotate any real Stripe secret; review Google key restrictions and Firebase rules. Values were not printed, and Git history was not rewritten.

This is an independent portfolio demo, not affiliated with Airbnb.

## Manual review checklist

At desktop (1280px) and mobile (390px):
1. Search Cape Town; clear the search and try an unknown location.
2. Combine category, guest and budget filters; change sorting.
3. Save a stay, open Saved stays, reload and verify persistence.
4. Select dates in search, apply and search; verify date/guest values transfer to details. Cancel edited dates and check the previous choice remains. Try reversed dates and over 30 nights.
5. Preview a valid estimate and confirm it explicitly says nothing is booked.
6. Check keyboard navigation, browser Back, and the browser console.

See `docs/FRONTEND_REVIEW.md` for the code walkthrough, review findings and testing limitations.

## When to review code

Review each small working slice, review again before a commit, and request an independent review before merging. Check correctness first, then safety, edge cases, accessibility, tests and readability. Automated checks help, but do not replace reading the diff or using the app.
