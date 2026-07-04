#!/usr/bin/env python3
"""Export a diffable content-source snapshot from the current published corpus.

The current app still builds runtime JSON from workbooks. This exporter creates
the source-control ledger that lets future edits become stable, reviewable, and
versioned instead of hidden inside binary spreadsheets or regenerated blobs.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from content_source_utils import (
    SOURCE_SCHEMA_VERSION,
    build_source_manifest,
    load_json,
    semantic_key,
    stable_hash,
    stable_term_id,
    term_signature,
    write_json,
    write_jsonl,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--published-dir", type=Path, default=Path("public/content/published"))
    parser.add_argument("--glossary-workbook", type=Path, default=Path("data_glossary.xlsx"))
    parser.add_argument("--structure-workbook", type=Path, default=Path("data_structure.xlsx"))
    parser.add_argument("--taxonomy-registry", type=Path, default=Path("data/taxonomy-registry.json"))
    parser.add_argument("--out-dir", type=Path, default=Path("content/source"))
    parser.add_argument("--slug-history", type=Path, default=Path("content/migrations/slug-history.json"))
    parser.add_argument("--path-sequences", type=Path, default=Path("content/source/path-sequences.json"))
    parser.add_argument("--emerging-terms", type=Path, default=Path("content/source/emerging-terms-2024-2026.json"))
    return parser.parse_args()


def build_source_row(term: dict[str, Any], duplicate_source_key: bool = False) -> dict[str, Any]:
    title = str(term["title"])
    canonical_slug = str(term["slug"])
    published_projection = {
        "title": title,
        "aliases": term.get("aliases", []),
        "summary": term.get("summary", ""),
        "taxonomy": term.get("taxonomy", {}),
        "metadata": term.get("metadata", {}),
        "blocks": term.get("blocks", []),
        "links": term.get("links", {}),
    }
    row = {
        "schemaVersion": SOURCE_SCHEMA_VERSION,
        "termId": stable_term_id(title, canonical_slug if duplicate_source_key else None),
        "status": "active",
        "revision": 1,
        "sourceKey": semantic_key(title),
        "title": title,
        "canonicalSlug": canonical_slug,
        "slugHistory": [canonical_slug],
        "aliases": term.get("aliases", []),
        "taxonomy": term.get("taxonomy", {}),
        "metadata": term.get("metadata", {}),
        "source": term.get("source", {}),
        "publishedArtifact": f"public/content/published/terms/by-slug/{canonical_slug}.json",
        "publishedContentHash": stable_hash(published_projection),
    }
    row["contentHash"] = term_signature(row)
    return row


def main() -> int:
    args = parse_args()
    index_path = args.published_dir / "terms" / "index.json"
    by_slug_dir = args.published_dir / "terms" / "by-slug"
    if not index_path.exists():
        raise SystemExit(f"Missing published term index: {index_path}")
    if not by_slug_dir.exists():
        raise SystemExit(f"Missing published term detail directory: {by_slug_dir}")

    summaries = load_json(index_path)
    source_key_counts: dict[str, int] = {}
    for summary in summaries:
        source_key = semantic_key(summary["title"])
        source_key_counts[source_key] = source_key_counts.get(source_key, 0) + 1
    rows: list[dict[str, Any]] = []
    slug_history: dict[str, dict[str, Any]] = {}
    for summary in summaries:
        slug = summary["slug"]
        detail_path = by_slug_dir / f"{slug}.json"
        if not detail_path.exists():
            raise SystemExit(f"Missing term detail artifact for {slug}: {detail_path}")
        term = load_json(detail_path)
        row = build_source_row(term, source_key_counts.get(semantic_key(term["title"]), 0) > 1)
        rows.append(row)
        slug_history[row["termId"]] = {
            "canonicalSlug": row["canonicalSlug"],
            "slugHistory": row["slugHistory"],
            "status": row["status"],
        }

    rows.sort(key=lambda item: (item["title"].lower(), item["termId"]))
    write_jsonl(args.out_dir / "terms.jsonl", rows)
    manifest = build_source_manifest(
        rows,
        {
            "glossaryWorkbook": args.glossary_workbook,
            "structureWorkbook": args.structure_workbook,
            "taxonomyRegistry": args.taxonomy_registry,
            "publishedManifest": args.published_dir / "manifest.json",
            "pathSequences": args.path_sequences,
            "emergingTerms": args.emerging_terms,
        },
    )
    write_json(args.out_dir / "content-lock.json", manifest)
    write_json(args.slug_history, slug_history)
    print(f"Exported {len(rows)} source terms to {args.out_dir / 'terms.jsonl'}")
    print(f"Wrote manifest {args.out_dir / 'content-lock.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
