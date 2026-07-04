# ADR-0004: Consumer-Facing Learning Shell

Date: 2026-07-01
Status: Accepted
Owner: Codex implementation pass

## Decision

Make the public and membership shell feel like a consumer learning product, not an internal workspace.

The shell should explicitly guide a learner through four recurring jobs:

- read
- follow a path
- save memory
- review/export

It should present the corpus as a living field guide with:

- a browse-by-mode landing rail
- a real corpus-progress panel from published JSON
- editorial term pages with study-first language
- a study shelf and notebook that feel like part of the membership loop
- a continuity/account page that reads like a member room, not a settings console

## Context

The repo now has the core Cloudflare-native architecture in place:

- JSON-first content delivery
- Worker-based app/runtime boundaries
- Clerk-backed sign-in
- Dodo-backed billing
- D1-backed study state

The remaining product risk is not only technical; it is tonal and structural. A product can be fully wired and still feel like a dashboard if the public shell does not demonstrate the learning loop clearly.

## Options Considered

### Option A: Keep the current utility-shaped shell and rely on copy alone

Pros:

- low effort
- minimal code churn

Cons:

- preserves the “internal tool” feeling the user explicitly rejected
- does not help the membership offer explain itself visually
- risks the product feeling overbuilt and under-delivered even if the backend is correct

Decision: rejected

### Option B: Build a marketing-only landing page and leave the product surfaces untouched

Pros:

- easy to make the first screen look polished

Cons:

- the mismatch would show immediately after signup
- the product would still feel like separate tools instead of one coherent learning system

Decision: rejected

### Option C: Align the shell, browse, and member surfaces to the same learning-product language

Pros:

- makes the paid learning product understandable from the first click
- keeps the study loop consistent across public, saved, notes, account, and path screens
- lets JSON-backed content and published audits demonstrate the product’s structure

Cons:

- requires careful copy and hierarchy work across multiple routes
- can be overdone if every surface is treated like a marketing page

Decision: accepted

## Consequences

### Positive

- home and pricing now read as the same product
- browse, term, saved, notes, paths, and account surfaces are more coherent
- the corpus and structure work are visible in the app instead of only in docs

### Tradeoffs

- some implementation-oriented language still exists in deeper surfaces and docs
- the app will need ongoing tone checks as new study features land

## Validation Plan

- verify the browser-visible shell on home, pricing, explore, paths, term, saved, notes, account, and shared preview routes
- keep public content and audit metrics JSON-backed
- keep membership state clearly tied to login, bookmarks, notes, annotations, share, and export
- update docs when the product tone changes so the repo remains self-describing

## Revisit Triggers

Revisit this ADR if:

- the app reintroduces admin-style UI patterns on public or member-facing routes
- a future feature requires a more dashboard-like control surface
- the public learning model changes materially

