# AIGlossary v2 — Agent Instructions

## Project Overview

AIGlossary Pro is a paid-first AI/ML/DL learning web app. It is a structured study workspace built around 18,075 glossary terms. The product thesis: breadth of corpus × structured taxonomy × cross-links × personal study memory.

## Stack

- **Frontend:** React 19 (canary) SPA with Vite 8, React Router v7, TypeScript 6
- **Backend:** Cloudflare Workers (Wrangler) serving API + static assets
- **Database:** Cloudflare D1 (SQLite at edge)
- **Auth:** Clerk (optional, gated by `isClerkEnabled`)
- **Billing:** Dodo Payments
- **Styling:** Tailwind CSS v4 + shadcn/ui + custom CSS design tokens (4,000+ lines)
- **Content:** JSON-first, built offline via `tools/build_published_content.py`

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run test         # Vitest
npm run lint         # ESLint
```

## Directory Structure

```
src/
├── main.tsx              # Router setup, providers
├── styles.css            # Design tokens + component styles (4,000+ lines)
├── types.ts              # Core TypeScript types
├── routes/               # 16 page components (lazy-loaded)
├── components/
│   ├── ui/               # 35 shadcn/ui primitives
│   ├── domain/           # 12 domain components (term, study, curriculum, activity)
│   ├── layout/           # Container, Grid, Section, Stack
│   ├── feedback/         # ErrorBoundary, EmptyState
│   ├── shared/           # DirectionalTransition
│   └── providers/        # ThemeProvider (warm/slate palettes)
├── shell/                # AppLayout, HeaderAuthControls
├── auth/                 # Clerk config
├── content/              # CatalogContext, term blocks, manifest loaders
├── hooks/                # useMediaQuery, useDebounce, useToggle, useLocalStorage
├── study/                # StudyContext, bookmarks, notes, annotations, sync
├── platform/             # Worker API client
└── lib/                  # Utilities (cn)
worker/                   # Cloudflare Worker (API routes, billing, session, share)
data/                     # Taxonomy registry JSON
content/                  # Content schemas
tools/                    # Python content builder
Docs/                     # Architecture, product, design docs
```

## Routing

All routes are children of `AppLayout` shell, lazy-loaded via `React.lazy`:

| Route | Component | Description |
|---|---|---|
| `/` | HomePage | Landing page with hero, family lanes, featured grid |
| `/explore` | ExplorePage | Search/browse the glossary |
| `/term/:slug` | TermPage | Full study surface for a single term (790 lines) |
| `/paths` | PathsPage | Learning paths listing |
| `/paths/:pathSlug` | PathDetailPage | Individual path detail |
| `/families` | FamiliesPage | Study family overview |
| `/families/:familySlug` | FamilyDetailPage | Individual family detail (592 lines) |
| `/shared/:token` | SharedTermPage | Public shared term view |
| `/saved` | SavedPage | Bookmarked terms |
| `/notes` | NotesPage | Study notes |
| `/pricing` | PricingPage | Plans + checkout |
| `/account` | AccountPage | User account |
| `/login` | LoginPage | Clerk sign-in |
| `/signup` | SignupPage | Clerk sign-up |
| `/field-lab` | FieldLabPage | QA/inspection dashboard |

## Design System

- **Two palettes:** `warm` (cream/ink/burnt-orange) and `slate` (dark/cool), toggled via `data-palette` attribute
- **22 design tokens per palette:** surfaces, ink, accent, secondary, gold, borders, shadows, typography, spacing, radii
- **Typography:** Geist Variable (sans-serif body), Spectral (serif headings)
- **Palette toggle:** Sun/moon button in header, persisted in localStorage

## Context Providers

1. `AppProvider` — platform/Worker API state
2. `CatalogProvider` — content catalog (terms, paths, search index)
3. `StudyProvider` — bookmarks, notes, annotations, remote sync
4. `ClerkProviderBoundary` — optional auth
5. `ThemeProvider` — warm/slate palette management

## Key Files for Agent Work

- `src/styles.css` — Design tokens and all component styles
- `src/routes/TermPage.tsx` — Most complex page (790 lines)
- `src/routes/FamilyDetailPage.tsx` — Second most complex (592 lines)
- `src/components/domain/term/TermBlockRenderer.tsx` — Renders all 10 block types
- `src/content/CatalogContext.tsx` — Central data provider
- `src/study/StudyContext.tsx` — Study workspace state
- `worker/index.ts` — All API routes
- `motto_v3.md` — Engineering operating rules

## Agent Rule

Always read `motto_v3.md` before making changes. It defines the operating doctrine for this project.
