# Frontend Shell Status

Date: 2026-06-29
Status: Initial app shell implemented

## Addendum (2026-07-03)

- AI Elements is now installed as a narrow rendering layer, not a chatbot-shell replacement.
- Canonical prose renderer: `src/components/StudyRichText.tsx`, which wraps `@/components/ai-elements/message` -> `MessageResponse`.
- The generated AI Elements renderer was trimmed to the glossary use-case: prose markdown only, without code/math/mermaid plugin weight.
- Vite now splits glossary markdown rendering into dedicated `study-renderer` and `study-markdown` chunks so rich text stays isolated from the rest of the frontend shell.
- The renderer is now the expected path for:
  - term prose blocks,
  - rendered notebook content,
  - rendered annotation bodies and quoted excerpts.
- Product rule: preserve the field-guide shell and use AI Elements only where markdown or authored/generated rich text needs proper structure.

## What Exists Now

- Vite + React frontend shell
- Clerk-backed `/login` and `/signup` route surfaces
- local frontend dev proxy from `/api/*` to a Worker on `127.0.0.1:8787`
- published catalog boundary inside the app runtime
- real published term index for browse surfaces plus shard-based term detail loading for the full term page
- canonical aliases for safe duplicate variants now flow into the published search/browse surface
- generated learning paths now ship as a first-class static content surface under `/paths`
- static plan rendering even when the Worker API is unavailable
- Browser-router navigation for:
  - home
  - pricing
  - explore
  - paths
  - path detail
  - shared term preview
  - term detail
  - saved
  - notes
  - account
- local bookmark state
- local note state
- share-link copy
- public shared-term token route
- JSON export of study state
- Worker API boundary with:
  - `/api/health`
  - `/api/plans`
  - `/api/auth/session`
  - `/api/billing/checkout`
  - `/api/billing/webhook`
  - `/api/entitlements`
  - `/api/entitlements/claim`
  - `/api/bookmarks`
  - `/api/notes`
  - `/api/annotations`
  - `/api/share-links`
  - `/api/shared/:token`
  - `/api/exports`
  - SPA asset fallback
- auth-aware frontend API client that sends Clerk bearer tokens to protected endpoints (plans/session, checkout, study state, workspace actions)

## Why This Is Useful

This now validates the product interaction model against the real glossary corpus while the production secrets/bindings are still environment work:

- the term page shape
- the generated path page shape
- the saved/notes workflow
- the export behavior
- the split between static frontend content and Worker APIs
- the content boundary now runs against the real workbook-derived publication model: browse from index, load detail on demand
- the consumer-facing routes remain previewable in local frontend dev even when `/api/*` is unavailable

## What Is Browser-Local Today

- bookmarks and notes fall back to `localStorage` only when there is no authenticated app actor
- authenticated study state now caches to localStorage as a backup, but the primary source is Worker + D1
- authenticated API calls now send Clerk session auth headers so protected routes are no longer silently local for signed-in users
- share falls back to canonical link copy when there is no authenticated app actor
- no production Clerk keys in this local environment unless supplied
- local D1 binding is now available in `wrangler.jsonc` for local simulation
- local frontend preview can still render static plan copy without the Worker, but account/auth/billing state now surfaces as unavailable rather than pretending to be a real local session
- authenticated term sharing now creates `unlisted` share links that can be opened through `/shared/:token`

## Next Upgrade Path

1. create the live Cloudflare D1 database, add the `DB` binding in `wrangler.jsonc`, and apply the canonical migrations
2. run a full signed-in payment-to-entitlement end-to-end check with real Clerk + Dodo test creds
3. decide whether launch browse/search should stay monolithic or move to sharded manifests for performance
4. deepen the best generated paths with editorial sequencing for the highest-value topics
5. expand editorial depth beyond taxonomy and the small inline-definition subset
6. add richer entitlement/account status surfaces and post-purchase lifecycle messaging
7. add runtime tests for auth-bound API error paths and token refresh behavior

## Addendum (2026-06-29 Validation Pass)

- Confirmed the published corpus is workbook-derived and current:
  - running `tools/build_published_content.py` against `data_glossary.xlsx` and `data_structure.xlsx` recreates `public/content/published` artifacts with `termCount=17988`, `pathCount=57`, and matching import report metrics.
- Confirmed production-critical API surfaces are wired:
  - `/api/health`, `/api/plans`, `/api/auth/session` return valid JSON responses in local `wrangler dev`.
  - `/api/billing/checkout` enforces auth + config gates (`400` without body fields, `401` when unauthenticated, `503` when D1 is missing).
  - `bookmarks`, `notes`, `annotations`, `share-links`, `exports` require active membership and therefore reject non-entitled access with `402`.
- confirmed with an active local D1 binding, unentitled authenticated calls now map to `401` (auth required) before entitlement checks and `402` (no membership) once session is present.
- confirmed remaining blocker:
  - live behavior is now gated by runtime environment bindings (`DB`, Clerk, and Dodo credentials); full production verification still requires those three credential sets plus a Clerk/Dodo test flow in a signed-in session.

## Addendum (2026-06-30 Study Sync Migration)

- Implemented local-to-remote study migration on paid sign-in in `src/study/StudyContext.tsx`.
- Added dedicated sync plan contract in `src/study/sync.ts` and test coverage in `src/study/sync.test.ts`:
  - compute remote-aware merge plans,
  - sync only local-only bookmarks/notes,
  - preserve remote records as the source-of-truth.
- Verified behavior:
  - signed-in users load remote study state,
  - local-only local bookmarks and notes are appended and uploaded to D1,
  - local backup still persists from signed-in state for continuity.
- Completed follow-up:
  - added partial sync error reporting in `src/study/sync.ts` so sync failures are no longer hard-failing the entire study load,
  - call sites now record partial-failure sync warnings during signed-in loads,
  - worker auth/billing path tests now assert `/api/checkout` and `/api/billing/webhook` high-risk response contracts.

## Addendum (2026-06-30 Home Surface Narrowing)

- The home page no longer renders the full corpus as a landing-grid dump.
- The editorial strip now pulls a real highlight slice from generated learning paths and their featured terms, which keeps the B2C landing surface readable while still staying corpus-authentic.
- Verified in browser at `http://127.0.0.1:4321/` after the path preview swap and the term-grid narrowing.

## Addendum (2026-06-30 Workspace Memory Surfaces)

- The notebook page now reads like a study ledger with preview cards, excerpts, and word-count cues instead of a plain note list.
- The saved page now presents saved shelves and export history as a portable study memory surface rather than an account utility table.
- This reinforces the app’s consumer-learning model: browse is curated, study memory is personal, and export/share are part of the retention loop.
- Verified in browser at `http://127.0.0.1:4321/notes` and `http://127.0.0.1:4321/saved`.

## Addendum (2026-06-30 Corpus and Production Layer Closure)

- The published corpus is no longer a curated sample: `public/content/published` is generated from the workbook-derived importer, and the current build reports `termCount=17988` and `pathCount=57`.
- The auth, billing, and study surfaces now exist as real Worker-backed paths:
  - Clerk-backed session resolution through `/api/auth/session`
  - Dodo checkout / webhook handling through `/api/billing/checkout` and `/api/billing/webhook`
  - D1-backed bookmarks, notes, annotations, share links, exports, and entitlement state
- The remaining gap is environmental, not architectural: production Cloudflare bindings and live Clerk/Dodo credentials still need to be supplied in the deployment target before the full paid flow can be exercised end to end.
- This closes the stale “sample content / unfinished core” framing that was still hanging around in earlier status notes.

## Addendum (2026-06-30, source-trace trust surface)

- Term pages now surface source-trace chips from the workbook snapshot so learners can see where a term came from before they trust the explanation.
- Source-backed markdown blocks are labeled distinctly in the renderer so the imported definition snippet reads as verified corpus content rather than generic prose.
- This keeps the consumer surface aligned with the accuracy work: the corpus is not just rebuilt correctly, it is also visibly traceable in the product.

## Addendum (2026-06-30, study loop surface upgrade)

- The saved page now frames bookmarks as a paid study shelf with membership messaging, shelf resumption cues, and export history in one view.
- The notes page now frames note depth as a study asset with notebook metrics, strongest-note recall, and export-adjacent continuation actions.
- This keeps the app shell aligned with the B2C learning model: users should see why saving, noting, and exporting matter inside the membership loop, not as disconnected utility pages.

## Addendum (2026-07-01, corpus progress surface)

- The home page now reads `reports/content-audit.json` and exposes corpus progress directly in the learner-facing shell.
- That surface distinguishes published term count from editorial depth by showing definition-backed terms, taxonomy-linked terms, and study-family terms as separate signals.
- This makes “how much is done?” answerable in-app with real published JSON instead of chat memory or a vague completion percentage.

## Addendum (2026-07-01, browse-by-mode landing rail)

- The home page now includes a consumer-facing browse rail for `read`, `follow a path`, `save memory`, and `review/export`.
- This turns the landing page into a learning-product entry point with distinct jobs to do, instead of a single undifferentiated glossary wall.
- Browser verification captured the page at `http://127.0.0.1:5182/` after the change, confirming the content-mode rail sits below the hero and above the corpus/term surfaces.

## Addendum (2026-07-01, term article polish)

- Term pages now open with a stronger editorial intro, more deliberate note/annotation wording, and a softer study-article tone.
- The browser capture at `http://127.0.0.1:5184/term/1-bit-adam` showed the updated term page as a premium study desk rather than a technical record view.
- The underlying study features stayed the same; only the first-impression language and hierarchy changed.

## Addendum (2026-07-01, account continuity room)

- The account page now reads like a membership continuity room instead of an auth/control panel.
- Copy was softened around login, entitlements, and sync so the page emphasizes study continuity, not implementation detail.
- Browser verification captured the page at `http://127.0.0.1:5185/account`, confirming the member state cards still communicate the same functionality with a cleaner product tone.

## Addendum (2026-07-01, saved shelf and notebook tone)

- The saved shelf now reads as a study shelf with a return path and exportable memory rather than a generic bookmark list.
- The notebook now reads as a study notebook with a clear instruction to write the version of the idea worth keeping.
- Browser verification captured both `http://127.0.0.1:5186/saved` and `http://127.0.0.1:5186/notes`, confirming the member loop feels consistent across saved state and note-taking.

## Addendum (2026-07-01, path and shared-preview polish)

- The paths pages now read as guided learning trails rather than category indexes.
- The shared term preview now opens with a stronger editorial cue so shared links feel like a graceful entry point to the study system.
- Browser verification captured `http://127.0.0.1:5187/paths` and `http://127.0.0.1:5187/paths/natural-language-processing-text-analysis`, confirming the path flow works as a coherent learning sequence.
