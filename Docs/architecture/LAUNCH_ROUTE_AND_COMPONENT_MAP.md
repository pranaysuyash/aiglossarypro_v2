# Launch Route and Component Map

Date: 2026-06-29
Status: Recommended v1 app boundary

## Routes

### Public

- `/`
- `/field-lab`
- `/pricing`
- `/login`
- `/explore`
- `/paths`
- `/paths/:pathSlug`
- `/shared/:token`
- `/topic/:topicSlug`
- `/category/:categorySlug`
- `/term/:slug`

### Authenticated

- `/saved`
- `/notes`
- `/collections`
- `/account`
- `/export-history`

### API

- `/api/auth/session`
- `/api/billing/checkout`
- `/api/billing/webhook`
- `/api/entitlements/claim`
- `/api/bookmarks`
- `/api/notes`
- `/api/annotations`
- `/api/collections`
- `/api/share-links`
- `/api/shared/:token`
- `/api/exports`

Auth adapter rule:

- Worker routes consume one app-level authenticated actor contract
- Clerk should eventually populate that actor through validated session handling
- downstream study and entitlement routes should not each invent their own auth parsing

## Core Page Components

### Public shell

- `MarketingLayout`
- `SiteHeader`
- `PricingTable`
- `AuthGuardBanner`

### Explore

- `SearchInput`
- `SearchResults`
- `TaxonomySidebar`
- `TopicHero`
- `CategoryGrid`

### Paths

- `PathIndexGrid`
- `PathHero`
- `PathStepList`
- `PathStepCard`

### Term page

- `TermHero`
- `TaxonomyPills`
- `RelatedTermsRail`
- `TermBlockRenderer`
- `BookmarkButton`
- `QuickNoteComposer`
- `ShareActions`
- `ExportActions`

### Shared term page

- `SharedTermHero`
- `SharedTermPreview`
- `SharedTermConversionRail`

### Personal knowledge

- `SavedTermsList`
- `NotesWorkspace`
- `AnnotationDrawer`
- `CollectionsPanel`
- `ExportHistoryTable`

## Block Renderer Contract

The frontend should not contain page-specific logic for every source-sheet field.

It should use:

- `TermBlockRenderer`
- per-type components:
  - `MarkdownBlock`
  - `BulletsBlock`
  - `StepsBlock`
  - `TableBlock`
  - `MermaidBlock`
  - `QuizBlock`
  - `ReferencesBlock`

## Auth and Billing Guards

### Public-but-teaser pages

- term pages can expose title, taxonomy, and partial summary
- premium gate appears before full blocks

### Fully gated pages

- notes
- bookmarks
- collections
- exports

### Billing durability rule

- checkout should not depend on account-link timing being perfect
- payment webhooks should be able to create pending entitlements before user claiming
- token-based shared reads should use one public resolution path and must reject private or expired links

## Why This Boundary Matters

- keeps SEO and acquisition possible without a free tier
- keeps the implementation componentized
- avoids the previous likely trap of mixing marketing, learning, and editor complexity into one surface

## Addendum (2026-06-30)

### Public-shell direction

The launch surface should read as a consumer learning product, not an internal tool.

That means the public home and pricing experience should visibly include:

- a visual concept cluster or field-guide preview
- notebook artifacts such as saved cards or annotation snippets
- membership framing that emphasizes transformation and serious study
- shelf-like browsing, not table-like admin navigation

### Recommended additional public components

- `ConceptClusterPreview`
- `NotebookArtifactStrip`
- `MembershipValuePanel`
- `FieldGuideCover`
- `ShelfRail`

## Addendum (2026-07-02)

### Inspection surface

The product now also needs a first-class public inspection route:

- `/field-lab`

This route exists because the app already contains real corpus, path, and study-memory behavior,
but the surface can otherwise read like a premium brochure instead of a testable learning system.

The field lab should make the following visibly inspectable in one place:

- route coverage and sample-entry links
- feature loops such as bookmark, note, export, share, and path resume
- component proof for home-surface cards
- manifest-driven block coverage
- launch-contract visibility
- structure-registry visibility
- paged live term access across the published corpus

Because this route is a diagnostic and exploration surface rather than the primary acquisition
entry, it should stay lazily loaded so the home/library path keeps the main bundle focused on the
core learning experience.

That same loading rule should apply to the broader route graph: keep the shell and default home
surface eager, but lazy-load secondary pages at the route boundary so study workspaces, account
flows, and inspection tools do not bloat first paint for the primary learning experience.

The same principle applies to auth libraries in local or signed-out flows: avoid bundling Clerk UI
and provider code into the default public shell when the current runtime can defer that cost until
an auth surface is actually needed.

### Why this matters

- a text-first hero makes the product feel like a docs portal
- a visual preview of learning artifacts makes the product feel paid and intentional
- the homepage should demonstrate the study loop before the user reads about it
