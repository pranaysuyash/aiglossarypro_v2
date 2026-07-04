# aiglossary_v2 UI audit and accessibility pass

Date: 2026-07-04

## Scope

Reviewed the primary shell and shared button primitives under `src/shell/AppLayout.tsx`, `src/styles.css`, and `src/components/ui/button.tsx` against the current UI audit rubric and the project motto.

## Findings resolved

1. Added a skip link and main landmark to support keyboard and screen-reader navigation on every route.
2. Added explicit focus-visible treatment for nav links, primary/ghost buttons, and text links.
3. Replaced shared `transition-all` usage in the button primitive with explicit properties.
4. Added stronger visual distinction for text links so interactive copy no longer reads as static body text.
5. Added `name`, `spellCheck`, and `autoComplete` metadata to the app's search and annotation controls so the form surfaces are robust across the full app.

## Long-term path

- Keep skip navigation and visible focus treatment in the shared shell so every route inherits the same baseline.
- Keep focus styling in the shared primitives instead of patching individual screens.
- Use explicit transition properties only for the properties that actually animate.
- Keep form metadata on route-level controls so search and annotation surfaces stay resilient as the app grows.

## Verification

- Static inspection of the edited UI shell and shared button primitive.
- `npm run build` passed with a clean production bundle.
