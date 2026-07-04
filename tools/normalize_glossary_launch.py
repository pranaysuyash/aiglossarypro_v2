#!/usr/bin/env python3
"""Normalize launch-scope glossary content into published JSON artifacts.

This tool intentionally uses the verified launch-safe columns from the glossary
sheet:

- column A: term title
- columns N:P: topic, category, sub category

It does not try to ingest the full editorial superset yet. That richer mapping
belongs in a later stage once the launch path is working end to end.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


WHITESPACE_RE = re.compile(r"\s+")
NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def normalize_label(value: str) -> str:
    value = value.strip()
    value = WHITESPACE_RE.sub(" ", value)
    return value


def normalize_key(value: str) -> str:
    return normalize_label(value).lower()


def slugify(value: str) -> str:
    slug = NON_ALNUM_RE.sub("-", normalize_key(value)).strip("-")
    return slug or "untitled"


def read_rows(path: Path) -> list[list[str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.reader(handle))


def get_cell(row: list[str], index: int) -> str:
    if index >= len(row):
        return ""
    return normalize_label(row[index])


def resolve_slug(base_slug: str, used_slugs: Counter[str]) -> str:
    if used_slugs[base_slug] == 0:
        used_slugs[base_slug] += 1
        return base_slug

    used_slugs[base_slug] += 1
    return f"{base_slug}-{used_slugs[base_slug]}"


def build_term_record(row_number: int, row: list[str], used_slugs: Counter[str]) -> dict | None:
    title = get_cell(row, 0)
    if not title:
        return None

    lower_title = normalize_key(title)
    if lower_title == "terms":
        return None

    topic = get_cell(row, 13)
    category = get_cell(row, 14)
    sub_category = get_cell(row, 15)

    base_slug = slugify(title)
    slug = resolve_slug(base_slug, used_slugs)

    tags = [
        slugify(value)
        for value in [category, sub_category]
        if value
    ]

    summary = ""
    if category and sub_category:
        summary = f"{title} is classified under {category} / {sub_category}."
    elif category:
        summary = f"{title} is classified under {category}."

    return {
        "id": slug,
        "slug": slug,
        "title": title,
        "aliases": [],
        "summary": summary,
        "taxonomy": {
            "topic": topic or title,
            "category": category,
            "subCategory": sub_category,
            "tags": tags,
        },
        "links": {
            "prerequisites": [],
            "related": [],
            "alternatives": [],
            "next": [],
        },
        "blocks": [
            {
                "id": "summary",
                "type": "markdown",
                "title": "Overview",
                "body": summary or f"{title} is part of the AIGlossary launch taxonomy.",
            }
        ],
        "metadata": {
            "difficulty": None,
            "maturity": None,
            "implementationComplexity": None,
            "researchMaturity": None,
            "lastReviewedAt": None,
        },
        "source": {
            "glossarySheet": {
                "sheetName": "main",
                "rowNumbers": [row_number],
            },
            "structureTemplateVersion": "2026-06-29",
        },
    }


def merge_term_records(canonical: dict, incoming: dict) -> None:
    canonical["source"]["glossarySheet"]["rowNumbers"].extend(
        incoming["source"]["glossarySheet"]["rowNumbers"]
    )

    existing_aliases = {normalize_key(alias) for alias in canonical["aliases"]}
    if normalize_key(incoming["title"]) != normalize_key(canonical["title"]) and normalize_key(incoming["title"]) not in existing_aliases:
        canonical["aliases"].append(incoming["title"])

    for alias in incoming["aliases"]:
        if normalize_key(alias) not in existing_aliases:
            canonical["aliases"].append(alias)
            existing_aliases.add(normalize_key(alias))

    for field in ["topic", "category", "subCategory"]:
        if not canonical["taxonomy"][field] and incoming["taxonomy"][field]:
            canonical["taxonomy"][field] = incoming["taxonomy"][field]

    merged_tags = []
    seen_tags = set()
    for tag in [*canonical["taxonomy"]["tags"], *incoming["taxonomy"]["tags"]]:
        if tag and tag not in seen_tags:
            merged_tags.append(tag)
            seen_tags.add(tag)
    canonical["taxonomy"]["tags"] = merged_tags

    if not canonical["summary"] and incoming["summary"]:
        canonical["summary"] = incoming["summary"]


def build_duplicate_groups(terms: list[dict]) -> list[dict]:
    groups = []
    for term in terms:
        row_numbers = term["source"]["glossarySheet"]["rowNumbers"]
        if len(row_numbers) <= 1:
            continue
        groups.append(
            {
                "slug": term["slug"],
                "title": term["title"],
                "rowNumbers": row_numbers,
                "duplicateRowCount": len(row_numbers) - 1,
            }
        )
    return groups


def build_taxonomy_tree(terms: list[dict]) -> dict:
    tree: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))

    for term in terms:
        category = term["taxonomy"]["category"] or "Uncategorized"
        sub_category = term["taxonomy"]["subCategory"] or "Uncategorized"
        tree[category][sub_category].append(
            {
                "slug": term["slug"],
                "title": term["title"],
            }
        )

    categories = []
    for category_name in sorted(tree):
        subcategories = []
        for subcategory_name in sorted(tree[category_name]):
            members = sorted(tree[category_name][subcategory_name], key=lambda item: item["title"].lower())
            subcategories.append(
                {
                    "name": subcategory_name,
                    "termCount": len(members),
                    "terms": members,
                }
            )

        categories.append(
            {
                "name": category_name,
                "subcategories": subcategories,
            }
        )

    return {"categories": categories}


def build_search_index(terms: list[dict]) -> list[dict]:
    search_rows = []
    for term in sorted(terms, key=lambda item: item["title"].lower()):
        search_rows.append(
            {
                "slug": term["slug"],
                "title": term["title"],
                "aliases": term["aliases"],
                "category": term["taxonomy"]["category"],
                "subCategory": term["taxonomy"]["subCategory"],
                "searchText": " | ".join(
                    [
                        term["title"],
                        *(term["aliases"]),
                        term["taxonomy"]["category"] or "",
                        term["taxonomy"]["subCategory"] or "",
                    ]
                ).strip(" |"),
            }
        )
    return search_rows


def build_catalog_index(terms: list[dict]) -> list[dict]:
    return [
        {
            "id": term["id"],
            "slug": term["slug"],
            "title": term["title"],
            "aliases": term["aliases"],
            "summary": term["summary"],
            "taxonomy": term["taxonomy"],
            "metadata": {
                "difficulty": term["metadata"]["difficulty"],
                "maturity": term["metadata"]["maturity"],
            },
        }
        for term in sorted(terms, key=lambda item: item["title"].lower())
    ]


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", required=True, type=Path, help="Glossary CSV export.")
    parser.add_argument("--out-dir", required=True, type=Path, help="Output directory for published artifacts.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rows = read_rows(args.content)
    if not rows:
        raise SystemExit("Input CSV is empty.")

    used_slugs: Counter[str] = Counter()
    canonical_by_title: dict[str, dict] = {}
    skipped_blank_rows = 0

    for row_number, row in enumerate(rows[1:], start=2):
        record = build_term_record(row_number, row, used_slugs)
        if record is None:
            if not get_cell(row, 0):
                skipped_blank_rows += 1
            continue
        title_key = normalize_key(record["title"])
        existing = canonical_by_title.get(title_key)
        if existing is None:
            canonical_by_title[title_key] = record
        else:
            merge_term_records(existing, record)

    terms = list(canonical_by_title.values())

    terms_dir = args.out_dir / "terms" / "by-slug"
    for term in terms:
        write_json(terms_dir / f"{term['slug']}.json", term)

    index_payload = build_catalog_index(terms)
    taxonomy_payload = build_taxonomy_tree(terms)
    search_payload = build_search_index(terms)
    duplicate_groups = build_duplicate_groups(terms)
    report_payload = {
        "termCount": len(terms),
        "blankFirstColumnRowsSkipped": skipped_blank_rows,
        "distinctCategories": len(taxonomy_payload["categories"]),
        "slugCollisionCount": sum(1 for count in used_slugs.values() if count > 1),
        "canonicalizedDuplicateGroups": len(duplicate_groups),
        "duplicateRowsMerged": sum(group["duplicateRowCount"] for group in duplicate_groups),
    }

    write_json(args.out_dir / "terms" / "index.json", index_payload)
    write_json(args.out_dir / "taxonomy" / "category-tree.json", taxonomy_payload)
    write_json(args.out_dir / "search" / "search-index.json", search_payload)
    write_json(args.out_dir / "reports" / "normalization-report.json", report_payload)
    write_json(args.out_dir / "reports" / "duplicate-groups.json", duplicate_groups)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
