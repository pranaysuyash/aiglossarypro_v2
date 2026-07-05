# Daily Learning Loop Review (2026-07-04)

## Product Decision

Start with the signed-in learning loop rather than another marketing pass:

1. Continue the next concept in the active path.
2. Record opened concepts as a recency-ordered history.
3. Schedule quiz attempts into a review queue.
4. Let review rows deep-link back to the quiz block.
5. Let dashboard search carry the query into the library route.

This reinforces AI Glossary Pro as a structured learning system rather than a static glossary.

## Implementation Notes

- `src/study/progress.ts` now exposes pure helpers for opened-term recency and next review scheduling so the behavior can be tested without browser storage.
- `src/routes/HomePage.tsx` uses the active path plus opened-term history to pick the next study concept and to render recent concept recovery.
- `src/routes/ReviewPage.tsx` presents review due cards with the review box and a direct quiz deep link.
- `src/routes/TermPage.tsx` opens the correct extra tab when a hash targets a tabbed block such as `#quick-quiz`.
- `src/routes/ExplorePage.tsx` initializes search from `?q=` so the dashboard search field does not lose intent.

## Verification

- `npm run test -- src/study/progress.test.ts` passed.
- `npm run build` passed.
- Browser check on `http://127.0.0.1:4173/review` showed seeded due review cards for Attention Mechanism and Transformer.
- Browser check on `http://127.0.0.1:4173/term/attention-mechanism#quick-quiz` found the quiz block mounted and visible after the hash/tab bridge.
- Browser check on `http://127.0.0.1:4173/explore?q=transformer` showed the search input initialized to `transformer` and filtered results.

## Open Item

The authenticated dashboard was build-verified but not visually inspected as signed-in because the local dev API stub returns an unauthenticated session. To fully inspect the signed-in dashboard, run the dev API with an authenticated fixture or add a local mock-session toggle.

## Addendum (2026-07-05)

The open item was closed with an opt-in local API fixture:

- `tools/dev_api_stub.mjs` supports `AIGLOSSARY_DEV_AUTH=1 npm run dev:api` for a mock authenticated Pro learner.
- `README.md` documents the signed-in preview command.
- `src/shell/AppLayout.tsx` removes public marketing header/footer chrome for authenticated sessions so the dashboard renders as the app workspace, not as a nested page under public navigation.
- `src/styles.css` widens the authenticated shell and changes mobile ordering so the study surface appears before the compressed navigation.

Additional verification:

- `npm run build` passed after the mock-auth fixture and shell changes.
- Browser check on `http://127.0.0.1:4173/` with `AIGLOSSARY_DEV_AUTH=1 npm run dev:api` confirmed the signed-in dashboard renders without the public header, includes the sidebar, and exposes dashboard search.
- Browser check with seeded `aiglossary:last-opened-path=neural-networks-core-models` confirmed the Continue card selects the next path concept: `3D Convolutional Neural Network (3D CNN)`.
- Browser check at 390 x 844 confirmed the mobile view opens on dashboard content first, with navigation moved below the learning surface.

## Addendum (2026-07-05, Design Reference Match Pass)

The signed-in dashboard was reshaped to match the `page2.png` reference more directly:

- Dark left rail now uses icon-led nav items, an active purple nav slab, compact topic shortcuts, and a Pro upsell card.
- Dashboard topbar now includes search with shortcut affordance, streak, review notification, and profile chip.
- The main work area now uses a two-column app workspace: primary study column plus sticky right progress rail.
- Continue card now includes a diagram-style learning preview and compact path/progress metadata.
- Recommended concept and path cards were compressed into denser reference-style modules with small visual accents.
- Mobile keeps the study surface first and moves the nav rail below the main content.

Verification:

- `npm run build` passed after the reference-match pass.
- Browser check at 1536 x 1024 confirmed the signed-in surface has one app shell, dark rail, top utility bar, content column, and right rail.
- Browser check at 390 x 844 confirmed the first visual screen starts with the dashboard topbar and Continue card, not the sidebar.

Known follow-up:

- On mobile, CSS changes visual order so the dashboard appears before the sidebar, but DOM reading order still starts with the sidebar because the sidebar is first in markup. A future accessibility pass should reorder the signed-in markup or use a dedicated mobile nav pattern.

## Addendum (2026-07-05, Side-by-Side Visual QA)

The first reference-match pass was structurally aligned but not visually close enough to `page2.png`. A direct side-by-side inspection exposed these gaps:

- Authenticated dashboard colors were still inheriting the warm/orange global palette instead of the reference's dark navy + purple app palette.
- The React Scan dev overlay polluted visual QA screenshots.
- The dashboard topbar initially placed the welcome copy and search/profile utilities in one row, while the reference uses a utility row above the welcome block.
- Empty local study state made the Continue card look unlike the reference's returning-learner state.
- The right-rail stat layout needed explicit stacked text spacing to avoid cramped metric copy.

Changes made after that QA pass:

- Scoped authenticated dashboard tokens to a white/soft-gray canvas, dark navy sidebar, and purple accent.
- Made React Scan opt-in with `REACT_SCAN=1` so normal dev screenshots show the product, not tooling.
- Reworked the dashboard topbar into a two-row utility/welcome layout.
- Tightened card density, progress-ring layout, and recommendation/path module spacing.
- Captured a fair CSS-pixel screenshot at `Docs/reviews/assets/dashboard-refmatch-current-2026-07-05-v5-css.png`.

Current visual verdict:

- Close: shell structure, left rail, purple active state, top utility row, main/right-rail layout, progress/review/streak modules.
- Still not exact: custom logo, hand-curated short content labels, term-card illustration fidelity, the external "Continue your journey" section label, and right-rail microcopy density differ from the static reference.

## Addendum (2026-07-05, Page 4 Term Detail Pass)

The term detail route was reshaped toward the provided `page4.png` reference and the attached term-detail direction:

- `/term/:slug` now renders as a signed-in concept learning unit with the same dark app rail, top search/status row, and right learning rail pattern as the dashboard.
- The first screen now prioritizes breadcrumb, concept title, learner-facing definition, tags, difficulty/read-time/quiz metadata, Share, Add note, and Save.
- Raw source/build/workbook language was removed from the visible first-screen product surface.
- Learner tabs now use Overview, Explain, Visuals, How it works, Compare, Examples, Quiz, and Notes & Links.
- The default body starts with an In a nutshell card, three cognitive-load-reducing summary cards, and a visual explanation flow before deeper content blocks.
- The right rail now includes Study tools, Your progress, On this page, Related concepts, and helpfulness feedback.

Verification:

- `npm run build` passed after the page 4 pass.
- `npm run test -- src/study/progress.test.ts` passed.
- Browser check on `http://localhost:4173/term/attention-mechanism` with signed-in dev auth confirmed: concept shell mounted, Library nav active, human definition visible, learner tabs present, and right-rail cards present.
- Final CSS-pixel visual QA screenshot: `Docs/reviews/assets/page4-term-current-v3-css.png`.

Known visual differences from the static reference:

- The logo remains the app's existing placeholder mark, not the generated custom mark.
- The overview illustration is a coded concept-flow asset, not the exact attention diagram from the reference.
- Right rail content is product-real and simpler; the reference's Source & further reading card is not implemented because current public source metadata is internal/workbook-oriented and should not be exposed directly.

## Addendum (2026-07-05, Page 4 Completion Pass)

The final page 4 pass tightened the term detail surface after visual QA:

- Related concepts were capped to four visible rail rows so Source & further reading appears in the first desktop viewport.
- The learner tab row now wraps cleanly instead of clipping the Quiz / Notes & Links labels at 1536 x 1024.
- Duplicate related-concept React keys were removed so repeated catalog labels do not generate runtime identity warnings.
- `index.html` now includes an inline SVG favicon to remove the development favicon 404 during browser QA.
- The final preserved screenshot is `Docs/reviews/assets/page4-term-current-complete-final-css.png`.

Final verification:

- `npm run build` passed.
- `npm run test -- src/study/progress.test.ts` passed with 12 tests.
- Browser QA at `http://localhost:4174/term/attention-mechanism` showed 0 console errors and 1 existing React Router hydration fallback warning.
- Visual inspection confirmed the route now matches the page 4 reference structure: dark app rail, top search/status row, concept header, learner tabs, overview module, study tools/progress rail, related concepts, and public reading sources.

Remaining differences are intentional:

- The app keeps honest catalog metadata (`standard`, 10 minute read, 6 flashcards) instead of faking the static reference's editorial values.
- The logo and attention diagram are coded approximations rather than generated bitmap assets.

## Addendum (2026-07-05, Page 4 Final Visual Pass)

A last visual pass tightened the remaining reference mismatches without changing the underlying product truth:

- The term topbar now includes a back affordance, matching the reference's left-chevron structure.
- The brand mark was refined from a square placeholder into a more reference-like multi-stroke glyph.
- The term title now stays on one desktop line, which removes the awkward wrap visible in the earlier screenshots.
- The latest preserved screenshot is `Docs/reviews/assets/page4-term-current-final-pass2-css.png`.

Verification:

- `npm run build` passed after the logo and title refinements.
- `npm run test -- src/study/progress.test.ts` passed with 12 tests.
- Browser QA at `http://localhost:4173/term/attention-mechanism` showed 0 console errors and 1 existing React Router hydration fallback warning.
- Visual inspection now reads much closer to `page4.png`: logo silhouette, title rhythm, back affordance, and first viewport hierarchy all line up more tightly.

What still differs by design:

- The page still uses real catalog metadata instead of the reference's editorial placeholder counts and labels.
- The attention illustration remains a coded diagram, not a bitmap recreation.
