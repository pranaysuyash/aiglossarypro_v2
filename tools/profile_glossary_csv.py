#!/usr/bin/env python3
"""Profile glossary CSV exports for AIGlossary v2 planning.

This tool is intentionally simple and dependency-free so it can run in a fresh
repo. It profiles the first column heavily because the current request points to
column A in both sheets as the main term/topic surface.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path
from typing import Iterable


WHITESPACE_RE = re.compile(r"\s+")
NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def normalize_label(value: str) -> str:
    value = value.strip().lower()
    value = WHITESPACE_RE.sub(" ", value)
    return value


def slugify(value: str) -> str:
    normalized = normalize_label(value)
    slug = NON_ALNUM_RE.sub("-", normalized).strip("-")
    return slug or "untitled"


def read_rows(path: Path) -> tuple[list[str], list[list[str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        rows = list(reader)

    if not rows:
      return [], []

    return rows[0], rows[1:]


def profile_rows(header: list[str], rows: list[list[str]], sheet_name: str) -> dict:
    first_column_values: list[str] = []
    blank_first_column_rows = 0
    non_empty_rows = 0

    for row in rows:
        padded = row + [""] * max(0, len(header) - len(row))
        if any(cell.strip() for cell in padded):
            non_empty_rows += 1

        first_value = padded[0].strip() if padded else ""
        if first_value:
            first_column_values.append(first_value)
        else:
            blank_first_column_rows += 1

    raw_counts = Counter(first_column_values)
    normalized_counts = Counter(normalize_label(value) for value in first_column_values)
    slug_counts = Counter(slugify(value) for value in first_column_values)

    duplicates_raw = {
        key: count for key, count in raw_counts.items() if count > 1
    }
    duplicates_normalized = {
        key: count for key, count in normalized_counts.items() if count > 1
    }
    duplicate_slugs = {
        key: count for key, count in slug_counts.items() if count > 1
    }

    return {
        "sheet_name": sheet_name,
        "header": header,
        "row_count": len(rows),
        "non_empty_row_count": non_empty_rows,
        "blank_first_column_rows": blank_first_column_rows,
        "first_column_non_empty_count": len(first_column_values),
        "unique_first_column_count": len(raw_counts),
        "unique_normalized_first_column_count": len(normalized_counts),
        "unique_slug_count": len(slug_counts),
        "duplicate_raw_count": len(duplicates_raw),
        "duplicate_normalized_count": len(duplicates_normalized),
        "duplicate_slug_count": len(duplicate_slugs),
        "sample_first_column_values": first_column_values[:25],
        "top_raw_duplicates": top_items(duplicates_raw.items()),
        "top_normalized_duplicates": top_items(duplicates_normalized.items()),
        "top_slug_duplicates": top_items(duplicate_slugs.items()),
    }


def top_items(items: Iterable[tuple[str, int]], limit: int = 50) -> list[dict]:
    ordered = sorted(items, key=lambda item: (-item[1], item[0]))
    return [
        {"value": value, "count": count}
        for value, count in ordered[:limit]
    ]


def write_duplicates_csv(path: Path, rows: list[list[str]], label: str) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["value", "count"])
        for row in rows:
            writer.writerow(row)


def export_duplicate_rows(
    out_dir: Path,
    filename: str,
    values: list[str],
    normalizer,
) -> None:
    counts = Counter(normalizer(value) for value in values)
    duplicates = [
        [value, str(count)]
        for value, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
        if count > 1
    ]
    write_duplicates_csv(out_dir / filename, duplicates, filename)


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", required=True, type=Path, help="CSV export for the content sheet.")
    parser.add_argument("--structure", required=True, type=Path, help="CSV export for the structure sheet.")
    parser.add_argument("--out-dir", required=True, type=Path, help="Directory for generated reports.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    content_header, content_rows = read_rows(args.content)
    structure_header, structure_rows = read_rows(args.structure)

    content_profile = profile_rows(content_header, content_rows, "content_main")
    structure_profile = profile_rows(structure_header, structure_rows, "structure_sheet2")

    write_json(args.out_dir / "content_profile.json", content_profile)
    write_json(args.out_dir / "structure_profile.json", structure_profile)

    content_first_column = [row[0].strip() for row in content_rows if row and row[0].strip()]
    structure_first_column = [row[0].strip() for row in structure_rows if row and row[0].strip()]

    export_duplicate_rows(
        args.out_dir,
        "content_duplicates.csv",
        content_first_column,
        normalize_label,
    )
    export_duplicate_rows(
        args.out_dir,
        "structure_duplicates.csv",
        structure_first_column,
        normalize_label,
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
