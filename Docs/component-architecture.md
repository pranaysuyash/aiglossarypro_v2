# Component Architecture Design Document

## Overview

This document defines the standard component architecture for AIGlossary v2, following first principles, shadcn/ui patterns, and long-term maintainability.

## Architecture Principles

### 1. Layered Component Structure

```
src/
├── components/
│   ├── ui/                    # Base UI primitives (shadcn-style)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── select.tsx
│   │   ├── accordion.tsx
│   │   ├── tooltip.tsx
│   │   ├── separator.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── skeleton.tsx
│   │   ├── alert.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── popover.tsx
│   │   ├── hover-card.tsx
│   │   ├── scroll-area.tsx
│   │   ├── resizable.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── switch.tsx
│   │   ├── checkbox.tsx
│   │   ├── radio-group.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   ├── slider.tsx
│   │   ├── progress.tsx
│   │   ├── table.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── pagination.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── sheet.tsx
│   │   ├── drawer.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── form.tsx
│   │   ├── input-otp.tsx
│   │   ├── calendar.tsx
│   │   ├── input-group.tsx
│   │   ├── index.ts           # Barrel export
│   ├── domain/                # Domain-specific components
│   │   ├── term/
│   │   │   ├── TermCard.tsx
│   │   │   ├── TermBlockRenderer.tsx
│   │   │   ├── TermExtrasTabs.tsx
│   │   │   ├── StudyRichText.tsx
│   │   │   └── index.ts
│   │   ├── study/
│   │   │   ├── ContinueLearningCard.tsx
│   │   │   ├── ContinuePathCard.tsx
│   │   │   ├── StudyMemoryCard.tsx
│   │   │   └── index.ts
│   │   ├── curriculum/
│   │   │   ├── LearningAtlasCard.tsx
│   │   │   ├── StructureExplorerCard.tsx
│   │   │   ├── LaunchCurriculumPreview.tsx
│   │   │   ├── CorpusProgressPreview.tsx
│   │   │   └── index.ts
│   │   ├── activity/
│   │   │   ├── RecentActivityCard.tsx
│   │   │   └── index.ts
│   ├── shared/                # Shared cross-domain components
│   │   ├── DirectionalTransition.tsx
│   │   └── index.ts
│   ├── layout/                # Layout primitives
│   │   ├── container.tsx
│   │   ├── grid.tsx
│   │   ├── stack.tsx
│   │   ├── section.tsx
│   │   └── index.ts
│   ├── feedback/              # Feedback components
│   │   ├── empty-state.tsx
│   │   ├── error-boundary.tsx
│   │   └── index.ts
│   ├── ai-elements/           # AI-specific components
│   │   ├── message.tsx
│   │   ├── StudyRichText.tsx
│   │   └── index.ts
│   ├── hooks/                 # Component-specific hooks
│   │   ├── index.ts
│   ├── utils/                 # Component utilities
│   │   ├── index.ts
│   ├── providers/             # React context providers
│   │   ├── theme-provider.tsx
│   │   └── index.ts
│   └── index.ts               # Main barrel export
```

### 2. Design Token System (CSS Variables)

All design tokens are defined as CSS custom properties in `src/styles.css` and mapped to Tailwind via `@theme inline` (Tailwind v4).

**Token Hierarchy:**
- **Brand Tokens** (abstract): `--accent-primary`, `--secondary`, `--gold`
- **Semantic Tokens** (purpose): `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`
- **Component Tokens** (specific): `--button-bg`, `--input-border`, `--card-shadow`

### 3. Component Patterns

#### Base UI Components (shadcn-style)
- Use `class-variance-authority` (CVA) for type-safe variants
- Forward refs for composition
- Semantic color tokens only
- Radix UI primitives for accessibility
- `cn()` utility for class merging

#### Compound Components
- Context-based state management
- Explicit composition (parent + children)
- Full TypeScript inference

#### Domain Components
- Compose base UI components
- Business logic separated from presentation
- Testable in isolation

### 4. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component file | PascalCase + `.tsx` | `Button.tsx` |
| Component export | PascalCase | `export function Button()` |
| Props interface | ComponentName + `Props` | `ButtonProps` |
| Variants | `variant` + `size` | `variant="outline" size="sm"` |
| Compound parts | Parent + Part | `Card.Header`, `Tabs.List` |
| Hooks | `use` + PascalCase | `useToast` |
| Utilities | camelCase | `cn()`, `formatDate()` |

### 5. Import Aliases (from components.json)

```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 6. Accessibility Requirements

- All interactive components must have proper ARIA attributes
- Focus management for overlays (Dialog, Sheet, Popover)
- Keyboard navigation for all custom components
- Screen reader support (sr-only labels)
- Color contrast ratios (WCAG AA minimum)
- Reduced motion support

### 7. Dark Mode Strategy

- CSS variables for all colors
- `dark:` variant in Tailwind
- Theme provider for persistence
- System preference detection

### 8. Responsive Design

- Mobile-first breakpoints
- Container queries where appropriate
- Fluid typography with `clamp()`
- Flexible grid system

### 9. Animation Standards

- Use `tailwindcss-animate` for enter/exit animations
- Respect `prefers-reduced-motion`
- Consistent duration tokens
- No layout shifts

### 10. Testing Strategy

- Unit tests for component logic (Vitest + React Testing Library)
- Visual regression tests (Storybook + Chromatic)
- Accessibility tests (axe-core)
- Integration tests for compound components

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. Design token system enhancement
2. Base UI components (Button, Input, Card, Dialog, Tabs, Select, Label, Textarea)
3. Component registry/index
4. Theme provider

### Phase 2: Compound & Layout (Week 2)
1. Compound components (FormField, DataTable, CommandPalette)
2. Layout primitives (Container, Grid, Stack, Section)
3. Feedback components (Toast, EmptyState, ErrorBoundary)
4. AI elements enhancement

### Phase 3: Domain Migration (Week 3)
1. Migrate existing domain components
2. Standardize patterns across all components
3. Add component documentation
4. Set up Storybook

### Phase 4: Quality (Week 4)
1. Comprehensive test coverage
2. Visual regression setup
3. Performance optimization
4. Documentation completion

## Decision Records

### ADR-001: Use shadcn/ui patterns with Radix UI
**Date:** 2026-07-04
**Context:** Need consistent, accessible, customizable component primitives
**Decision:** Adopt shadcn/ui patterns (CVA + Radix + Tailwind) as the standard
**Consequences:** 
- All new components follow this pattern
- Existing components migrated incrementally
- No custom CSS for component internals

### ADR-002: CSS Variables for Design Tokens
**Date:** 2026-07-04
**Context:** Need runtime theming and dark mode support
**Decision:** Use CSS custom properties mapped to Tailwind via `@theme inline`
**Consequences:**
- All colors, spacing, radii, shadows as CSS variables
- Tailwind config minimal (only content paths)
- Easy theme switching

### ADR-003: Compound Components via React Context
**Date:** 2026-07-04
**Context:** Need type-safe multi-part components
**Decision:** Use React Context for compound component state
**Consequences:**
- Explicit composition required
- Full TypeScript inference
- No prop drilling

### ADR-004: Component Co-location by Domain
**Date:** 2026-07-04
**Context:** Need scalable organization for 50+ components
**Decision:** Organize by domain (ui/, compound/, domain/, layout/, feedback/)
**Consequences:**
- Clear ownership boundaries
- Easy to find related components
- Scales with team growth

## Migration Checklist

### Existing Components to Migrate

| Component | Current Location | Target Location | Status |
|-----------|------------------|-----------------|--------|
| Button | `src/components/ui/button.tsx` | `src/components/ui/button.tsx` | ✅ Already standardized |
| Tooltip | `src/components/ui/tooltip.tsx` | `src/components/ui/tooltip.tsx` | ✅ Already standardized |
| Separator | `src/components/ui/separator.tsx` | `src/components/ui/separator.tsx` | ✅ Already standardized |
| TermCard | `src/components/TermCard.tsx` | `src/components/domain/term/TermCard.tsx` | ✅ Migrated |
| TermBlockRenderer | `src/components/TermBlockRenderer.tsx` | `src/components/domain/term/TermBlockRenderer.tsx` | ✅ Migrated |
| TermExtrasTabs | `src/components/TermExtrasTabs.tsx` | `src/components/domain/term/TermExtrasTabs.tsx` | ✅ Migrated |
| ContinueLearningCard | `src/components/ContinueLearningCard.tsx` | `src/components/domain/study/ContinueLearningCard.tsx` | ✅ Migrated |
| ContinuePathCard | `src/components/ContinuePathCard.tsx` | `src/components/domain/study/ContinuePathCard.tsx` | ✅ Migrated |
| LearningAtlasCard | `src/components/LearningAtlasCard.tsx` | `src/components/domain/curriculum/LearningAtlasCard.tsx` | ✅ Migrated |
| StructureExplorerCard | `src/components/StructureExplorerCard.tsx` | `src/components/domain/curriculum/StructureExplorerCard.tsx` | ✅ Migrated |
| LaunchCurriculumPreview | `src/components/LaunchCurriculumPreview.tsx` | `src/components/domain/curriculum/LaunchCurriculumPreview.tsx` | ✅ Migrated |
| RecentActivityCard | `src/components/RecentActivityCard.tsx` | `src/components/domain/activity/RecentActivityCard.tsx` | ✅ Migrated |
| StudyMemoryCard | `src/components/StudyMemoryCard.tsx` | `src/components/domain/study/StudyMemoryCard.tsx` | ✅ Migrated |
| CorpusProgressPreview | `src/components/CorpusProgressPreview.tsx` | `src/components/domain/curriculum/CorpusProgressPreview.tsx` | ✅ Migrated |
| StudyRichText (root) | `src/components/StudyRichText.tsx` | `src/components/domain/term/StudyRichText.tsx` | ✅ Migrated |
| DirectionalTransition | `src/components/DirectionalTransition.tsx` | `src/components/shared/DirectionalTransition.tsx` | ✅ Migrated |
| ai-elements/message | `src/components/ai-elements/message.tsx` | `src/components/ai-elements/message.tsx` | ✅ Keep |

### New Components to Create

| Component | Location | Priority |
|-----------|----------|----------|
| Input | `src/components/ui/input.tsx` | P0 |
| Textarea | `src/components/ui/textarea.tsx` | P0 |
| Label | `src/components/ui/label.tsx` | P0 |
| Card | `src/components/ui/card.tsx` | P0 |
| Dialog | `src/components/ui/dialog.tsx` | P0 |
| Tabs | `src/components/ui/tabs.tsx` | P0 |
| Select | `src/components/ui/select.tsx` | P0 |
| Accordion | `src/components/ui/accordion.tsx` | P0 |
| Badge | `src/components/ui/badge.tsx` | P0 |
| Avatar | `src/components/ui/avatar.tsx` | P0 |
| Skeleton | `src/components/ui/skeleton.tsx` | P0 |
| Alert | `src/components/ui/alert.tsx` | P0 |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` | P0 |
| Popover | `src/components/ui/popover.tsx` | P0 |
| HoverCard | `src/components/ui/hover-card.tsx` | P0 |
| ScrollArea | `src/components/ui/scroll-area.tsx` | P0 |
| Resizable | `src/components/ui/resizable.tsx` | P0 |
| Switch | `src/components/ui/switch.tsx` | P0 |
| Checkbox | `src/components/ui/checkbox.tsx` | P0 |
| RadioGroup | `src/components/ui/radio-group.tsx` | P0 |
| Toggle | `src/components/ui/toggle.tsx` | P0 |
| ToggleGroup | `src/components/ui/toggle-group.tsx` | P0 |
| Slider | `src/components/ui/slider.tsx` | P0 |
| Progress | `src/components/ui/progress.tsx` | P0 |
| Table | `src/components/ui/table.tsx` | P0 |
| Breadcrumb | `src/components/ui/breadcrumb.tsx` | P0 |
| Pagination | `src/components/ui/pagination.tsx` | P0 |
| Command | `src/components/ui/command.tsx` | P0 |
| ContextMenu | `src/components/ui/context-menu.tsx` | P0 |
| Menubar | `src/components/ui/menubar.tsx` | P0 |
| NavigationMenu | `src/components/ui/navigation-menu.tsx` | P0 |
| Sidebar | `src/components/ui/sidebar.tsx` | P0 |
| Sheet | `src/components/ui/sheet.tsx` | P0 |
| Drawer | `src/components/ui/drawer.tsx` | P0 |
| AlertDialog | `src/components/ui/alert-dialog.tsx` | P0 |
| Form | `src/components/ui/form.tsx` | P0 |
| InputOTP | `src/components/ui/input-otp.tsx` | P0 |
| Calendar | `src/components/ui/calendar.tsx` | P0 |
| DatePicker | `src/components/ui/date-picker.tsx` | P0 |
| Chart | `src/components/ui/chart.tsx` | P1 |
| FormField | `src/components/compound/form-field.tsx` | P0 |
| DataTable | `src/components/compound/data-table.tsx` | P0 |
| CommandPalette | `src/components/compound/command-palette.tsx` | P0 |
| Container | `src/components/layout/container.tsx` | P0 |
| Grid | `src/components/layout/grid.tsx` | P0 |
| Stack | `src/components/layout/stack.tsx` | P0 |
| Section | `src/components/layout/section.tsx` | P0 |
| Toast | `src/components/feedback/toast.tsx` | P0 |
| EmptyState | `src/components/feedback/empty-state.tsx` | P0 |
| ErrorBoundary | `src/components/feedback/error-boundary.tsx` | P0 |
| ThemeProvider | `src/components/providers/theme-provider.tsx` | P0 |

## Verification Criteria

### Code Quality
- [ ] All components have proper TypeScript types
- [ ] All components forward refs where applicable
- [ ] All components use semantic color tokens
- [ ] All components have accessibility attributes
- [ ] All components support dark mode
- [ ] All components respect reduced motion

### Testing
- [ ] Unit tests for all base UI components
- [ ] Integration tests for compound components
- [ ] Visual regression tests for all components
- [ ] Accessibility tests pass

### Documentation
- [ ] Component API documentation
- [ ] Usage examples for each component
- [ ] Migration guide for existing components
- [ ] Design token reference

### Performance
- [ ] No unnecessary re-renders (React.memo where appropriate)
- [ ] Lazy loading for heavy components
- [ ] Bundle size within budget
- [ ] No layout shifts