# ADR-0009: Content Sharding Strategy

Date: 2026-07-04
Status: Accepted (live)
Owner: Implementation pass

## Decision

Split the published term corpus into **deterministic two-character shard files** keyed by the first two alphanumeric characters of each term's slug.

Terms are grouped by `resolve_shard_id(slug)`:

```python
def resolve_shard_id(slug: str) -> str:
    alnum = "".join(c for c in slug.lower() if c.isalnum())
    if not alnum:
        return "misc"
    if len(alnum) == 1:
        return f"{alnum}_"
    return alnum[:2]
```

Each shard is written as a separate JSON file under `public/content/published/terms/shards/{shard_id}.json` (e.g., `an.json`, `tr.json`, `kp.json`). A `shard-manifest.json` maps shard IDs to term counts for load planning.

## Context

The published corpus contains 17,988 term records, each with the full runtime payload: summary, taxonomy, aliases, blocks (~9-17 block types), links, metadata, and source evidence. A single file containing all 17,988 records would be:

- **~85 MB** uncompressed — too large for a blocking fetch
- **Not cacheable incrementally** — changing one term requires re-downloading the entire corpus
- **Slow to parse** — deserializing 85 MB of JSON on the client blocks the main thread

The frontend needs to:
1. Load a lightweight catalog index (slugs + titles + taxonomy only) for browse/search
2. Load individual term detail on demand (user clicks a term → fetch its shard)
3. Keep initial bundle size small enough for fast first paint
4. Support CDN caching of immutable shard files

A single large corpus file fails all four requirements.

## Options Considered

### Option A: One file per term (18k files)

Pros:
- Maximum granularity — load exactly one term at a time
- Simple URL: `terms/by-slug/{slug}.json`

Cons:
- 18,000 separate HTTP requests for bulk operations
- 18,000 files in the build output — slow to deploy, list, and diff
- High connection overhead even with HTTP/2

Decision: rejected.

### Option B: Alphabetical shards (a.json, b.json, ...)

Pros:
- Simple, intuitive grouping
- At most 26 shards
- Client-side algorithm is trivial

Cons:
- Very uneven distribution: ~3,500 terms in `a.json`, ~200 in `x.json`
- Wasted download for sparsely populated shards
- Alphabetical order doesn't match access patterns

Decision: rejected.

### Option C: Two-character shards (aa.json, ab.json, ac.json, ...)

Pros:
- Good distribution: ~676 possible shard IDs, actual count ~500 for 18k terms
- ~36 terms per shard on average — reasonable granularity
- Deterministic — same slug always goes to the same shard
- Simple client-side computation (no lookup table needed on the client)
- Works with the existing `artifact.shardId` field on every term record

Cons:
- Shard boundaries are arbitrary (no semantic grouping)
- Shards can still be uneven (~5 terms to ~120 terms depending on slug distribution)
- Requires a shard manifest for load planning

Decision: accepted.

### Option D: Content-type shards (blocks vs taxonomy vs metadata split)

Pros:
- Each shard contains semantically related data
- Could optimize frontend rendering paths

Cons:
- Complex client-side assembly logic
- Couples frontend rendering to sharding boundaries
- Schema changes require shard restructuring
- Cross-cutting references (e.g., a term's taxonomy affects how its blocks render)

Decision: rejected.

## Why This Path

The two-character shard strategy is the simplest approach that meets all four requirements:

- **~500 shards at ~36 terms each** is granular enough for on-demand loading
- **Deterministic** — shard ID computation is O(1), no lookup table needed
- **CDN-friendly** — shard files are immutable (content changes produce new shard contents via deterministic build)
- **Frontend-friendly** — the catalog index and shard manifest provide enough info for smart prefetching
- **Git-friendly** — 500 files diff more cleanly than 18k; a batch rebuild changes only affected shards

The distribution is not perfectly even (slug first-char frequency follows term title patterns: "a-" terms vastly outnumber "z-" terms), but the worst-case shard is still under 150 terms (~300 KB compressed) — acceptable for lazy loading.

## Consequences

### Positive

- **Deterministic**: Same slugs → same shards every build
- **Client-simple**: `resolve_shard_id(slug)` is a 5-line function the frontend can inline
- **CDN-cacheable**: Shard files change only when their terms' content changes
- **Lazy-loadable**: The frontend loads the catalog index (compact), then fetches one shard per detail view
- **Build-verifiable**: Shard manifest reports term counts per shard; uneven shards are flagged in the content audit

### Negative

- **Uneven distribution**: "ad-" and "ar-" shards are large (~120 terms); "xg-" and "ya-" shards are tiny (~5 terms)
- **No semantic grouping**: Related terms don't share a shard (e.g., "anomaly detection" and "anomaly score" may be in different shards)
- **Shard boundary is opaque**: A user browsing "attention" terms might need `at.json` for "attention mechanism" but `au.json" for "attention-based CNN"
- **Requires catalog index**: The frontend can't discover which shard to load without the lightweight `terms/index.json` manifest

### Worst-Case Shard Size

Based on the current corpus:
- Largest: ~120 terms (slug prefix "ad-"), ~350 KB uncompressed, ~70 KB gzipped
- Median: ~30 terms, ~90 KB uncompressed
- Smallest: ~3 terms (slug prefixes like "xg-", "ya-", "qv-")
- Total: ~500 shards for 17,988 terms

## Implementation Notes

### Build Output Structure

```
public/content/published/terms/
  index.json           # Full catalog index (compact: ~3 MB, no blocks)
  manifest.json        # Published manifest with term count, shard count, etc.
  shards/
    shard-manifest.json  # Maps shard_id → term_count
    an.json              # Terms whose slug starts with "an"
    tr.json              # Terms whose slug starts with "tr"
    ...
```

### Frontend Loading Strategy

1. Load `terms/index.json` for browse and search (compact: slug + title + taxonomy only)
2. When user navigates to a term detail page, compute `resolve_shard_id(slug)` and fetch `terms/shards/{shard_id}.json`
3. Cache the shard in memory — subsequent term clicks within the same shard are instant
4. Prefetch adjacent shards when the user is browsing sequentially

### Edge Cases

- **Slugs with no alphanumeric prefix** (e.g., pure-punctuation titles) → shard ID `misc`
- **Single-character alphanumeric slugs** → shard ID `{char}_` (e.g., "v-model" would be `v_`)
- **Non-Latin slugs** (rare in this corpus) → first two Unicode digits, same as alphanumeric extraction

## Validation Plan

- **Shard count matches expectation**: Current build produces ~500 shards for 18k terms (verified)
- **Shard manifest is consistent**: Two identical builds produce identical shard manifests
- **Frontend loading works**: Term detail pages correctly resolve shard IDs and fetch the right shard
- **No data loss**: Every term in `terms/index.json` appears in exactly one shard (verified by cross-reference)
- **Shard distribution is within bounds**: No shard exceeds 150 terms (current max: ~120)

## Revisit Triggers

Revisit this ADR if:

- Term count exceeds 50k (shard files become too large or too numerous)
- Access patterns show the shard granularity is too coarse (e.g., users consistently fetch entire shards for a single term)
- A more sophisticated sharding strategy (by taxonomy, by content depth tier, or by access frequency) measurably improves frontend performance
- The frontend moves to a streaming content model (e.g., GraphQL) that makes pre-sharded files unnecessary

## Related Files

- `tools/build_published_content.py` — `resolve_shard_id()`, `build_term_shards()`, `build_shard_manifest()`
- `public/content/published/terms/shards/` — generated shard files
- `public/content/published/terms/index.json` — catalog index
- `Docs/decisions/ADR-0001-platform-and-content-architecture.md` — JSON-first content delivery decision
- `Docs/architecture/TECHNICAL_ARCHITECTURE_2026-06-29.md` — content storage topology
