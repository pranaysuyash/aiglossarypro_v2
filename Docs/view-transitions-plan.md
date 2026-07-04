# View Transitions Implementation Plan

## Overview

Add React View Transitions to AIGlossary Pro using React's `<ViewTransition>` component (requires `react@canary`). This provides: directional page slides, shared element morphs (TermCard → TermHero), Suspense reveal animations, and persistent element isolation.

## Prerequisites

1. **Upgrade React**: `react@19.2.7` → `react@canary`, `react-dom@19.2.7` → `react-dom@canary`
2. **Verify compatibility**: `react-router-dom@7.18.0` peer-dep on `react` — canary satisfies this

## Implementation Steps

### Step 1: Upgrade React to Canary

```bash
npm install react@canary react-dom@canary
```

Verify `ViewTransition` is exported: `node -e "const r = require('react'); console.log(typeof r.ViewTransition)"`

### Step 2: Add CSS Recipes

Copy the complete CSS recipe set from `references/css-recipes.md` into `src/styles.css` (after existing styles). Includes:
- Timing variables (`--duration-exit`, `--duration-enter`, `--duration-move`)
- Shared keyframes (`fade`, `slide`, `slide-y`)
- Fade classes (`fade-in`, `fade-out`)
- Slide vertical (`slide-up`, `slide-down`)
- Directional navigation (`nav-forward`, `nav-back` — single-class approach)
- Shared element morph (`morph`)
- Text morph (`text-morph`)
- Persistent element isolation (`persistent-nav`)
- Reduced motion media query

### Step 3: Isolate Persistent Elements

Add `viewTransitionName` to elements that persist across route changes:

- **Site header** (`src/shell/AppLayout.tsx:30`): `style={{ viewTransitionName: 'site-header' }}`
- **Site footer** (`src/shell/AppLayout.tsx:67`): `style={{ viewTransitionName: 'site-footer' }}`

Add CSS for persistent element isolation (from recipes).

### Step 4: Create Reusable Components

#### `src/components/DirectionalTransition.tsx`

Wraps children in a type-keyed `<ViewTransition>` for directional page slides:

```tsx
import { ViewTransition } from 'react';

export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
```

#### `src/hooks/useNavigationDirection.ts`

Tracks navigation history to determine forward/back direction:

```tsx
import { useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startTransition } from 'react';
import { addTransitionType } from 'react'; // react@canary

const HIERARCHICAL_SEGMENTS = ['families', 'paths', 'term', 'field-lab', 'shared', 'saved', 'notes'];

function getDepth(pathname: string): number {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 0;
  if (HIERARCHICAL_SEGMENTS.includes(segments[0])) return 1;
  return 0;
}

export function useNavigationDirection() {
  const location = useLocation();
  const navigate = useNavigate();
  const history = useRef<string[]>([location.pathname]);

  const push = useCallback((to: string) => {
    const currentDepth = getDepth(location.pathname);
    const targetDepth = getDepth(to);
    const type = targetDepth > currentDepth ? 'nav-forward' : targetDepth < currentDepth ? 'nav-back' : 'nav-forward';

    history.current.push(to);
    startTransition(() => {
      addTransitionType(type);
      navigate(to);
    });
  }, [location.pathname, navigate]);

  return { push };
}
```

### Step 5: Wrap Page Components

Each page component gets wrapped in `<DirectionalTransition>`:

```tsx
// Example: src/routes/ExplorePage.tsx
import { DirectionalTransition } from '../components/DirectionalTransition';

export function ExplorePage() {
  return (
    <DirectionalTransition>
      <div className="page-grid">
        {/* existing page content */}
      </div>
    </DirectionalTransition>
  );
}
```

Apply to all 15 route components:
- `HomePage.tsx`
- `PricingPage.tsx`
- `ExplorePage.tsx`
- `FamiliesPage.tsx`
- `FamilyDetailPage.tsx`
- `PathsPage.tsx`
- `PathDetailPage.tsx`
- `TermPage.tsx`
- `FieldLabPage.tsx`
- `SharedTermPage.tsx`
- `SavedPage.tsx`
- `NotesPage.tsx`
- `AccountPage.tsx`
- `LoginPage.tsx`
- `SignupPage.tsx`

**Do NOT add VT to `AppLayout.tsx`** — layouts persist and never trigger enter/exit.

### Step 6: Navigation Strategy

**Do NOT use react-router-dom's `viewTransition` prop** — it conflicts with React's `<ViewTransition>` component. React expects to own `document.startViewTransition()` calls when `<ViewTransition>` is in the tree. Using both causes React to interrupt the router's transition.

All navigation goes through `useNavigationDirection()` which wraps `useNavigate()` in `startTransition` + `addTransitionType`. This activates React's VT system for all navigations.

#### Add Navigation Direction to Links

Replace all `<Link>` navigations that should be animated with the `useNavigationDirection` hook. Key locations:

**HomePage.tsx**: Links to `/term/:slug`, `/families/:slug`, `/paths/:slug`
**ExplorePage.tsx**: Links to `/term/:slug`
**FamiliesPage.tsx**: Links to `/families/:slug`
**FamilyDetailPage.tsx**: Links to `/term/:slug`, back to `/families`
**PathsPage.tsx**: Links to `/paths/:slug`
**PathDetailPage.tsx**: Links to `/term/:slug`, back to `/paths`
**SavedPage.tsx**: Links to `/term/:slug`
**NotesPage.tsx**: Links to `/term/:slug`
**TermPage.tsx**: Links to `/families`, back to `/explore`
**AppLayout.tsx**: All 9 `<NavLink>` items — keep `<NavLink>` for active state styling, but add `onClick` handler that calls `startTransition` + `addTransitionType('nav-forward')` + `navigate(to)`. This avoids the `viewTransition` prop conflict while preserving active state indicators.

### Step 7: Add Shared Element Transitions

#### TermCard ↔ TermHero

**List side** (`src/components/TermCard.tsx`):
```tsx
import { ViewTransition } from 'react';

// Inside TermCard, wrap the card content:
<ViewTransition name={`term-card-${term.slug}`} share="text-morph" default="none">
  <Link to={`/term/${term.slug}`}>
    {/* existing card content */}
  </Link>
</ViewTransition>
```

**Detail side** (`src/routes/TermPage.tsx`):
```tsx
<ViewTransition name={`term-card-${slug}`} share="text-morph">
  <div className="hero-card term-hero">
    {/* existing hero content */}
  </div>
</ViewTransition>
```

Use `text-morph` for the title (avoids raster scaling artifacts on text). Use `morph` for any images.

#### FamilyCard ↔ FamilyDetail

**List side** (`src/routes/FamiliesPage.tsx`):
```tsx
<ViewTransition name={`family-card-${family.slug}`} share="text-morph" default="none">
  <Link to={`/families/${family.slug}`}>
    <div className="family-card">{/* ... */}</div>
  </Link>
</ViewTransition>
```

**Detail side** (`src/routes/FamilyDetailPage.tsx`):
```tsx
<ViewTransition name={`family-card-${familySlug}`} share="text-morph">
  <div className="hero-card">{/* ... */}</div>
</ViewTransition>
```

#### PathCard ↔ PathDetail

Same pattern with `path-card-${path.slug}`.

### Step 8: Add Suspense Reveals

#### Route-Level Suspense

The current Suspense at `src/main.tsx:132` wraps the entire router. Keep it as-is for the initial load fallback. For route transitions, the inline loading states ("Loading catalog...") need to become Suspense-driven.

Convert each route's inline loading to a Suspense pattern:

```tsx
// Example: ExplorePage.tsx
import { Suspense } from 'react';
import { ViewTransition } from 'react';

export function ExplorePage() {
  return (
    <DirectionalTransition>
      <Suspense fallback={<ViewTransition exit="slide-down"><LoadingSkeleton /></ViewTransition>}>
        <ViewTransition enter="slide-up" default="none">
          <ActualContent />
        </ViewTransition>
      </Suspense>
    </DirectionalTransition>
  );
}
```

**Note:** Since routes are lazy-loaded, the Suspense boundary at the router level already handles the initial load. The inline loading states are for async data fetching within the route. These should be converted to use `<Suspense>` with `<ViewTransition>` wrappers.

#### Header Auth Controls

```tsx
// AppLayout.tsx
<Suspense fallback={
  <ViewTransition exit="slide-down">
    <button className="primary-button" type="button">Sign In</button>
  </ViewTransition>
}>
  <ViewTransition enter="slide-up" default="none">
    <HeaderAuthControls />
  </ViewTransition>
</Suspense>
```

### Step 9: Verify Navigation Paths

Walk through every navigation path and confirm:

| Path | Expected Animation | Verified |
|------|-------------------|----------|
| Home → Term detail | nav-forward slide + term-card morph | |
| Term detail → Home (back link) | nav-back slide | |
| Home → Family detail | nav-forward slide + family-card morph | |
| Home → Path detail | nav-forward slide + path-card morph | |
| Explore → Term detail | nav-forward slide + term-card morph | |
| Families → Family detail | nav-forward slide + family-card morph | |
| Paths → Path detail | nav-forward slide + path-card morph | |
| Any → Pricing | nav-forward slide (lateral) | |
| Header nav items | No directional slide (lateral) | |
| Suspense data load | slide-up reveal | |

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/DirectionalTransition.tsx` | Reusable type-keyed VT wrapper |
| `src/hooks/useNavigationDirection.ts` | Navigation with direction tagging |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Upgrade react + react-dom to canary |
| `src/styles.css` | Add CSS recipes (VT animations) |
| `src/shell/AppLayout.tsx` | Add viewTransitionName to header/footer, convert auth Suspense |
| `src/components/TermCard.tsx` | Add shared element name |
| `src/routes/*.tsx` (15 files) | Wrap in DirectionalTransition, add shared element names where applicable |
| `src/routes/ExplorePage.tsx` | Convert loading to Suspense + VT |
| `src/routes/TermPage.tsx` | Convert loading to Suspense + VT, add shared element |
| `src/routes/FamiliesPage.tsx` | Convert loading to Suspense + VT, add shared element |
| `src/routes/FamilyDetailPage.tsx` | Convert loading to Suspense + VT, add shared element |
| `src/routes/PathsPage.tsx` | Convert loading to Suspense + VT |
| `src/routes/PathDetailPage.tsx` | Convert loading to Suspense + VT, add shared element |
| `src/routes/SavedPage.tsx` | Convert loading to Suspense + VT |
| `src/routes/NotesPage.tsx` | Convert loading to Suspense + VT |
| `src/routes/PricingPage.tsx` | Wrap in DirectionalTransition |

## Risk Assessment

1. **react@canary stability**: Canary is pre-release. Test thoroughly. Rollback is `npm install react@19.2.7 react-dom@19.2.7`.
2. **react-router-dom compatibility**: v7.18.0 peer-dep on `react` — canary satisfies. No code changes needed.
3. **Browser support**: Chromium 111+, Firefox 144+, Safari 18.2+. Graceful degradation (no animation) on older browsers.
4. **Performance**: `document.startViewTransition()` captures a screenshot — minimal overhead for page transitions.
5. **Nested VT limitation**: Parent VT exit suppresses child VT enter/exit. Don't put VT in AppLayout wrapping `{children}`.
