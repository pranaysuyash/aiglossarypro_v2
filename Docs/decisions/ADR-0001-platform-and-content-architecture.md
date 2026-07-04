# ADR-0001: Platform and Content Architecture

Date: 2026-06-29
Status: Proposed
Owner: Codex planning pass

## Decision

Use a Cloudflare-native app architecture with:

- React Router full-stack frontend
- Cloudflare Worker runtime
- JSON as the canonical public content delivery format
- D1 for user/account state
- R2 for export artifacts and later large content packs
- Dodo Payments for billing
- external auth provider at launch

## Context

The user has:

- a large glossary/topic corpus
- an existing overcomplicated predecessor
- a strong preference for long-term architecture without unnecessary complexity
- a requirement for paid-only access with recurring and lifetime plans

The product is content-heavy and personalization-light relative to a typical SaaS dashboard.

## Options Considered

### Option A: Put all content and user state in one relational database

Pros:

- one storage model
- easy admin querying

Cons:

- over-couples static content delivery to runtime DB
- weaker CDN story
- unnecessary query cost for public reads
- more migration surface

Decision: rejected for launch

### Option B: JSON-first content plus D1 for user state

Pros:

- simplest public read path
- best caching story
- content remains portable
- easy to diff and rebuild
- matches glossary access patterns

Cons:

- requires a build/ingest step
- content schema discipline matters

Decision: recommended

### Option C: Pure static site with localStorage user state only

Pros:

- extremely simple

Cons:

- no secure login
- no paid entitlements
- no cross-device notes/bookmarks
- not acceptable for the product requirement

Decision: rejected

### Option D: Pure self-built auth stack

Pros:

- maximum control

Cons:

- slows launch
- increases security burden
- not where differentiation lives

Decision: rejected for launch

## Why This Path

This path gives the best balance of:

- long-term portability
- launch simplicity
- operational clarity
- fast content delivery
- clean monetization support

## Consequences

### Positive

- public content stays cheap and fast to serve
- user state remains structured and queryable
- launch complexity is bounded
- the system can scale editorially without redesigning the app

### Negative

- ingest pipeline becomes a required system
- schema quality and taxonomy cleanup become early priorities
- auth provider abstraction must be intentional from the start

## Validation Plan

- obtain CSV exports
- run content profiling
- verify duplicate rate
- estimate published asset size
- build one published term pack and search shard
- validate bookmark/note D1 schema against real flows

## Revisit Triggers

Revisit this ADR if:

- content asset size becomes too large for the initial publish model
- editorial update frequency becomes near-real-time
- auth provider costs or constraints become unacceptable
- user-generated content becomes substantially richer than planned
