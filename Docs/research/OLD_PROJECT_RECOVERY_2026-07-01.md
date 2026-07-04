# Old Project Recovery Notes

Date: 2026-07-01
Scope: review the older `AIMLGlossary/AIGlossaryPro` project for reusable ideas and complexity traps, then translate the findings into guardrails for `aiglossary_v2`.

## What Looks Worth Reusing

- Public glossary browsing as an acquisition and trust surface.
- Search-heavy discovery, especially query highlighting and filterable results.
- Learning paths as an explicit product surface, not a hidden content link.
- Saved items, notes, annotations, and exports as retention primitives.
- Visual QA and browser proof before claiming product quality.
- Clear premium gating that demonstrates value in the learning flow.

## What Should Not Be Repeated

- Multiple deployment tracks for one product.
- Mixing EC2, ALB, S3, CloudFront, Firebase, Redis, and other stacks when one canonical runtime is enough.
- A content model that tries to expose the entire editorial blueprint directly as runtime UI.
- Free-tier / ad-supported positioning for a product that should be paid membership first.
- Utility-shaped shells that feel like internal ops tools.
- Auth and billing drift away from the main app runtime.
- Feature sprawl before the learner loop is stable.

## Concrete Architectural Lessons

### 1. Keep one runtime shape

The older project accumulated too many deployment and service layers. For v2, the runtime should stay:

- JSON content on the content side
- Cloudflare-native app/runtime on the delivery side
- D1 for mutable user state only
- Dodo for billing
- external auth for launch

### 2. Keep the content model bounded

The old system repeatedly suggested 295-column or 689-field style content surfaces. That is useful as a blueprint, but not as the runtime contract.

The better boundary is:

- compact published term JSON
- block-based rendering
- editorial structure as a registry, not a mirrored payload

### 3. Keep the product consumer-first

The strongest old-project ideas were the ones that made the app feel like a serious learning product:

- curated browsing
- study paths
- notebook/saved memory
- premium value demonstration

Those are the right signals for v2 too.

## Concrete Complexity Traps To Avoid

- Do not create a second CMS next to the JSON corpus.
- Do not reintroduce infrastructure sprawl just because each piece is individually familiar.
- Do not let “more features” outrun the readability of the shell.
- Do not make the structure sheet the public runtime shape.
- Do not let auth or billing become a separate product language from the learning surface.

## Implication For Current Work

The current repo is already moving in the right direction because it has:

- a JSON-first content pipeline
- published corpus artifacts
- block-based term rendering
- member surfaces for saved items, notes, paths, and share/export
- Cloudflare-oriented architecture

The main job now is to keep those choices coherent and resist reintroducing the older complexity model.

## Addendum (2026-07-02, actual old-project scan)

- The old project docs confirm the durable reuse candidates:
  - public glossary browsing as a discovery surface
  - searchable term pages with cross-links
  - saved items, notes, annotations, and exports as retention primitives
  - learning paths as explicit product surfaces
  - visual QA before declaring a surface launch-ready
- They also confirm the anti-patterns that should stay out of v2:
  - many overlapping processing/tooling versions for the same job
  - direct 295-column runtime thinking
  - mixing too many deployment/runtime tracks
  - utility-style shell language that reads like ops instead of consumer product
  - auth/billing drifting away from the main study experience
- The old deployment report also reinforces the deployment lesson: if a path works, keep the runtime simple and specific instead of broadening the stack just because the project has grown.
