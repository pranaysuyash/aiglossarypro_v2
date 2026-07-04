# Observability — Content Pipeline & App Runtime

Date: 2026-07-04
Status: Baseline
Source: `tools/build_published_content.py`, `worker/index.ts`, `public/content/published/reports/`

## Overview

This document describes what an operator can observe about the health of the content pipeline and the app runtime. The goal: after any build, deploy, or incident, the operator should be able to answer "what happened, when, and is the system healthy?"

---

## 1. Build Pipeline Observability

### 1.1 Build Reports (Always Generated)

Every successful build emits the following reports:

| File | Format | Purpose |
|---|---|---|
| `reports/content-audit.json` | JSON | Coverage metrics, quality checks, depth analysis |
| `reports/import-report.json` | JSON | Term counts by classification source, path counts |
| `reports/canonicalization-groups.json` | JSON | All merged semantic variant groups |
| `reports/duplicate-groups.json` | JSON | All detected duplicate/similar term groups |
| `reports/content-audit.json` (qualityChecks) | JSON | High-severity issue count, warnings |

These are generated to `{out-dir}/reports/` (default `public/content/published/reports/`).

### 1.2 Key Metrics to Check After a Rebuild

**Coverage health (`content-audit.json` → `coverage`):**

```json
{
  "taxonomyCoverageRatio": 0.7520,
  "taxonomyMatches": 13527,
  "unclassifiedTerms": 4461,
  "autoClassifiedTerms": 2013,
  "registryClassifiedTerms": 11471,
  "workbookClassifiedTerms": 0,
  "studyFamilyTerms": 17988,
  "totalRules": 365
}
```

Check:
- `taxonomyCoverageRatio` — should be ≥ 0.74 (the `TAXONOMY_COVERAGE_MINIMUM`). Below this, the build prints a warning.
- `unclassifiedTerms` — should not increase without explanation.
- `autoClassifiedTerms` — should match expected total from active rules.

**Quality checks (`content-audit.json` → `qualityChecks`):**

```json
{
  "highSeverityIssueCount": 0,
  "warnings": ["..."]
}
```

There must be zero high-severity issues. Warnings are informational.

**Import report (`import-report.json`):**

```json
{
  "termCount": 17988,
  "pathCount": 83,
  "taxonomyMatches": 13527,
  "autoClassifiedTerms": 2013,
  "unclassifiedTerms": 4461
}
```

`pathCount` should not drop — a decrease means learning paths were lost.

### 1.3 Build Warnings

The build prints a warning to stderr when:

- `taxonomyCoverageRatio` falls below `TAXONOMY_COVERAGE_MINIMUM` (0.74)
- A term's inferred study family has no matching entry in `STUDY_FAMILY_TAXONOMY_MAP`
- A learning path has fewer than 3 terms and is skipped (informational)
- A taxonomy registry entry references a non-existent term

### 1.4 Build Failures

The build exits non-zero when:

- **Workbook not found**: The glossary or structure path doesn't exist (exit code 2)
- **Sheet not found**: The glossary workbook is missing the `main` sheet or structure workbook is missing `Sheet2` (KeyError)
- **Syntax error in auto-classification rules**: Python compilation error (caught pre-run by `py_compile`)
- **OOM**: Python process exceeds available memory (~600 MB peak for 18k terms)
- **Disk full**: Cannot write output artifacts (IOError)

### 1.5 Determinism Check

A healthy build is deterministic: running twice on the same workbooks and same code produces byte-identical output.

To verify:
```bash
python3 tools/build_published_content.py --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx --out-dir /tmp/build1 --coverage-threshold 0
python3 tools/build_published_content.py --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx --out-dir /tmp/build2 --coverage-threshold 0
diff -r /tmp/build1 /tmp/build2
```

If `diff` produces any output, the build is non-deterministic. Investigate:
- Did the workbook change between runs?
- Is there a timestamp in any output?
- Is a set/dict iteration order non-deterministic (Python 3.6+ should be insertion-order-preserving, but check for unbucketed sets)?

---

## 2. App Runtime Observability

### 2.1 Worker Health Endpoint

The Worker exposes `GET /api/health`, which returns:

```json
{
  "status": "ok",
  "timestamp": "2026-07-04T12:00:00Z",
  "version": "2026-07-04-v1",
  "capabilities": {
    "clerk": true,
    "d1": false,
    "dodo": false
  },
  "d1MigrationStatus": "unknown"
}
```

Check:
- `status` should be `"ok"`
- `capabilities.clerk` — should be `true` when Clerk keys are configured
- `capabilities.d1` — should be `true` when a D1 binding is present
- `capabilities.dodo` — should be `true` when Dodo credentials are configured

### 2.2 Worker Error Logging

The Worker logs to Cloudflare Workers console (accessible via `wrangler tail`):

```bash
npx wrangler tail
```

Log levels used:
- `console.log` — successful operations (health checks, entitlement grants, export completions)
- `console.error` — failures (webhook signature mismatch, auth validation failure, D1 query failure)
- `console.warn` — degraded operations (fallback behavior, stale session, partial sync)

### 2.3 Known Failure Modes

| Symptom | Likely Cause | Check | Recovery |
|---|---|---|---|
| `/api/health` returns 500 | Worker crashed on startup | `wrangler tail` for stack trace | Redeploy |
| `capabilities.d1: false` | No D1 binding or database not created | `npx wrangler d1 list` | Run `wrangler d1 create` |
| `capabilities.clerk: false` | Missing `CLERK_SECRET_KEY` in env | Check `.dev.vars` or Worker env | Add credentials |
| `/api/billing/webhook` returns 401 | Dodo webhook signature mismatch | Check `DODO_PAYMENTS_WEBHOOK_KEY` | Re-set the webhook secret |
| D1 queries slow (>1s) | Cold start or index missing | Check D1 query performance in Cloudflare dashboard | Run D1 migration |
| Term page returns 404 | Shard file missing or slug not in index | Check `terms/index.json` for the slug | Rebuild |
| Login redirect fails | Clerk domain mismatch | Check `CLERK_AUTHORIZED_PARTIES` | Add the deploy domain |

### 2.4 Build Artifact Health Checks

After deploy, verify these URLs return valid JSON:

| URL | What It Should Return |
|---|---|
| `/content/published/terms/index.json` | Array of term catalog entries |
| `/content/published/terms/shards/shard-manifest.json` | Shard ID → count mapping |
| `/content/published/paths/index.json` | Array of path summaries |
| `/content/published/search/search-index.json` | Array of search entries |
| `/content/published/manifest.json` | Top-level manifest with termCount, pathCount |
| `/content/published/reports/content-audit.json` | Coverage and quality metrics |

### 2.5 Frontend Console Errors

When testing the frontend, watch for these console errors:

- `Failed to fetch shard {id}: 404` — shard file missing (rebuild needed)
- `Clerk: Missing publishable key` — `VITE_CLERK_PUBLISHABLE_KEY` not set
- `Worker API returned 401` — session expired or invalid Clerk token
- `Worker API returned 402` — user is authenticated but not entitled (expected for free users)
- `Failed to parse content-audit.json: ...` — stale or corrupted build artifact

---

## 3. Report Schemas

### 3.1 content-audit.json

```json
{
  "termCount": 17988,
  "coverage": {
    "taxonomyTerms": 13527,
    "taxonomyCoverageRatio": 0.7520,
    "unclassifiedTerms": 4461,
    "autoClassifiedTerms": 2013,
    "workbookClassifiedTerms": 0,
    "registryClassifiedTerms": 11471,
    "studyFamilyTerms": 17988,
    "studyFamilyCoverageRatio": 1.0,
    "totalRules": 365
  },
  "qualityChecks": {
    "highSeverityIssueCount": 0,
    "warnings": []
  },
  "depth": {
    "featured": 5,
    "standard": 17905,
    "sparse": 78
  }
}
```

### 3.2 import-report.json

```json
{
  "termCount": 17988,
  "pathCount": 83,
  "taxonomyMatches": 13527,
  "taxonomyCoverageRatio": 0.7520,
  "unclassifiedTerms": 4461,
  "autoClassifiedTerms": 2013,
  "workbookClassifiedTerms": 0,
  "registryClassifiedTerms": 11471,
  "studyFamilyClassifiedTerms": 43
}
```

---

## 4. What the Operator Should Check After Each Deploy

1. **Build output**: Verify `content-audit.json` coverage ratio ≥ 0.74, `highSeverityIssueCount` = 0
2. **Worker health**: `GET /api/health` — status = "ok"
3. **Frontend loads**: Navigate to `/` — no console errors
4. **Term page loads**: Navigate to `/term/{some-known-slug}` — term renders, blocks appear
5. **Search works**: Type a query in search — results appear
6. **Paid flow** (if credentials are configured): Walk through login → checkout → entitlement → study state
7. **Content integrity**: Spot-check 3-5 unclassified terms to ensure they haven't been misclassified

---

## 5. Long-Term Observability Gaps

- **No version markers in published JSON**: The build output has no embedded version or build timestamp. Cannot tell which build a deployed artifact came from.
- **No build log**: Each build overwrites `public/content/published/` without keeping a build log. If a build fails mid-write, the output directory is in an inconsistent state.
- **No coverage trend tracking**: Coverage metrics are point-in-time only. No easy way to see if coverage is trending up or down across builds.
- **No alerting**: The coverage threshold gate is a print-to-stderr warning, not a hard error. Builds below threshold still succeed.
- **No CI/CD integration**: The build script is meant to be run locally or in CI, but no CI workflow file exists yet.
