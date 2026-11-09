# Frontend walkthrough and review lesson

## One-line summary

Built a standalone, responsive React/TypeScript/Tailwind frontend so we can improve the stay-discovery experience before adding backend or LLM complexity.

## Read the code in this order

1. `index.html` loads `src/main.tsx`, which mounts React and imports the Tailwind-based stylesheet.
2. `src/types.ts` defines the shape of a Stay and the allowed filter values. TypeScript flags inconsistent data during development.
3. `src/data/stays.ts` supplies twenty fictional examples. There is no network inventory API.
4. `src/App.tsx` coordinates search state, favourites, hash navigation and page selection.
5. `src/lib/stays.ts` filters and sorts listings without changing the source array. The same module validates dates, calculates mock estimates and safely parses saved IDs.
6. `src/components/SearchBar.tsx` keeps date edits pending until Apply. `PropertySection.tsx` groups homes into responsive, keyboard-focusable carousels with resize-aware arrow controls.
7. `src/components/PropertyCard.tsx` displays a stay and has separate accessible links and save buttons.
8. `src/components/StayDetails.tsx` shows a gallery, amenities and the demo estimate. The preview action does not reserve or charge anything.
9. `src/styles.css` provides the visual design and responsive layouts. `Header`, `Icon` and `StayImage` share repeated UI behaviour.

**Flow:** Search form → filter state → pure filtering helper → property cards → hash detail link → validated dates → fictional estimate.

## When do we review?

- After a small working slice: easy to understand and cheaper to fix.
- Before a commit: read every changed/new file and run the checks.
- Before merging: another developer should review the change independently.
- After adding an LLM in the future: also review backend key handling, privacy, prompt boundaries, cost limits and error handling. None of that integration exists yet.

## What did this review find?

### Fixed before handoff

- **Correctness/accessibility:** a normal `#main-content` link conflicted with hash routing. The skip link now focuses main content without navigating. Browser verification checks focus and the URL.
- **Repository hygiene:** TypeScript emits a build-cache file. It is now ignored along with dependencies, build output and environment files.
- **Compatibility (initial rebuild):** the package was kept CommonJS-compatible to avoid changing legacy server behaviour. The legacy server was later removed with approval; the existing working tool configuration remains unchanged.

### Open findings

- **SHOULD FIX — development dependency tree:** npm audit reports seven moderate findings propagated through the TypeScript ESLint toolchain's minimatch dependency. npm also warns that ESLint 9 is unsupported. Resolve through a separately approved compatibility update, not `npm audit fix --force`. `npm audit --omit=dev` reports zero vulnerabilities; this does not certify the whole application as secure.
- **NICE TO HAVE — `src/App.tsx`:** extract the browse/search sections into more components as requirements grow. Avoid a large refactor before the current design is approved.

**Verdict:** Ready for local frontend feedback, with development-tool maintenance outstanding. Not approved for production or a public deployment.

## Airbnb-inspired redesign follow-up

Inspected the live Airbnb.co.za homepage and used its search-first layout, rounded search, compact cards and destination rows as visual inspiration. The interface is labelled Airbnb Clone, with an explicit independent-demo disclosure. The internal saved-stays storage key is retained so favourites are not lost.

- Replaced the large serif/earth-tone hero with a coral, white and charcoal interface.
- Expanded fictional inventory to 20 listings across three regional collections.
- Search dates and guests pass into details. Both views use the same date validator and mock fee calculation.
- Unavailable experiences/services are disabled, not fake working features. Hosting/currency controls explain the demo limits.
- Review caught uncommitted date edits surviving cancellation; pending date state now commits only on Apply.
- Review caught pluralisation for one-night card estimates; fixed and covered by a static-render regression test.
- Card image links have an inset keyboard focus outline so rounded photo clipping cannot hide focus.

Browser testing lesson: wait for React route updates and scroll completion before asserting. A retained carousel position after reload is valid browser behaviour, not evidence of a broken arrow. Reset the test position explicitly.

## Tests and evidence

Commands run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
git diff --check
```

- Typecheck, lint and production build pass.
- 46 Vitest cases pass: search, combined filters, sorting, fixture IDs, dates, pricing and saved-ID parsing.
- Browser checks at 1280px desktop and 390px mobile: search, categories, budget, guest capacity, saved views, reload persistence, details, invalid dates, estimate preview, unknown routes, browser Back and skip-link behaviour.
- Simulated blocked local storage: the app warns and keeps favourites in memory.
- Original listing photos loaded after scrolling; redesign desktop/mobile screenshots inspected. Images are illustrative and may repeat across fictional fixtures.
- Final browser flow: no JavaScript errors or HTTP error responses. Two earlier development hot-reload requests were aborted during a page reload and subsequently succeeded.
- An initial browser test expected the browse heading while the saved collection was active; the expected heading was corrected and the flow rerun. No app change was needed for that test expectation.

The browser checks were run through the available browser tool; they are not part of `npm test`. Other browser engines, screen-reader behaviour, real-device testing, production hosting are not verified. The removed legacy backend was not integration-tested.

## Decisions and trade-offs

- **Mock data first:** lets us design interactions without real bookings or API costs.
- **Pure helpers:** filter/pricing functions are easy to test without rendering the entire app.
- **Hash navigation:** avoids a new routing dependency and hosting rewrites. It is a simple demo choice, not the ideal final SEO architecture.
- **Local storage:** convenient single-browser favourites, not authenticated cross-device storage.
- **Illustrative external photos:** a quick visual starting point, not verified property photography. A local placeholder handles loading failures.
- **Legacy code removed with approval:** 38 unused root-level files, including old auth/payment/backend code, were deleted after verifying that the new entry imports only the `src/` app. Git history is retained; no history rewrite, dependency change or feature-branch switch was performed. The old app is not migrated feature-for-feature.

## Optional Gemini follow-up

The frontend-only phase is complete. A new loopback-only Gemini adapter and opt-in AI filter panel were subsequently added with approval. See `GEMINI_SETUP.md` for the current architecture, 98 mocked tests, setup and limits. No real Gemini request was made. The earlier frontend-only test counts and review notes above describe that phase.

**Security follow-up:** a redacted Git-history scan found a potential Stripe token in original `server.js:7` and a Google API-key pattern in original `firebase.js:5`. They remain in commit `19ef33d1`; no values were printed. Rotate any real Stripe secret and review Google key restrictions/Firebase rules. No history rewrite was approved or attempted.

## Stand-up explanation

- Done: rebuilt the frontend with typed mock listings, filters, favourites and property details.
- Next: configure and test the optional local Gemini finder after checking quota/billing; address development-tool maintenance and historical credential findings.
- Blockers/limits: no live availability, accounts or payments; all listing content is fictional. Gemini access/extraction quality is unverified until an approved live test.

## Questions a reviewer might ask

**Why TypeScript?** It gives shared data contracts and catches mismatched props and invalid filter values early. It does not replace runtime validation.

**Where does the LLM key live?** In the ignored server `.env`. The optional local backend reads it; React never receives it. AI stays disabled until explicitly enabled.

**What happens when local storage fails?** Favourites still work in memory, with an explicit warning that they will not persist.

**Does a price preview book a stay?** No. It calculates an example only, and explicitly says nothing has been reserved.

**Are the tests enough for production?** No. They establish a local baseline; broader accessibility, cross-browser, backend, security and deployment checks remain separate work.
