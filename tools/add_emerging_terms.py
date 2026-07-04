#!/usr/bin/env python3
"""Add emerging AI/ML terms to the glossary workbook from source JSON.

The term list lives in content/source/emerging-terms-2024-2026.json so recent
terms are reviewable product data, not hardcoded script literals.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

GLOSSARY_PATH = Path("data_glossary.xlsx")
EMERGING_TERMS_PATH = Path("content/source/emerging-terms-2024-2026.json")


def normalize_label(value: object | None) -> str:
    return " ".join(str(value or "").strip().split()).lower()


def load_terms(path: Path = EMERGING_TERMS_PATH) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    terms = payload.get("terms", [])
    if not isinstance(terms, list):
        raise ValueError(f"{path} must contain a terms array")
    return terms


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--glossary-workbook", type=Path, default=GLOSSARY_PATH)
    parser.add_argument("--terms-source", type=Path, default=EMERGING_TERMS_PATH)
    return parser.parse_args()


def main() -> None:
    """Append missing emerging terms to the glossary workbook's main sheet."""
    args = parse_args()
    terms = load_terms(args.terms_source)
    wb = load_workbook(args.glossary_workbook)
    sheet = wb["main"]

    existing: set[str] = set()
    last_data_row = 1
    for row in sheet.iter_rows(min_row=1, values_only=True):
        if row and any(value is not None for value in row):
            last_data_row += 1
        for index in (0, 1, 3, 4, 5, 6):
            if index < len(row) and row[index]:
                existing.add(normalize_label(row[index]))

    missing = [row for row in terms if normalize_label(row.get("title")) not in existing]
    print(f"Source terms: {len(terms)}")
    print(f"Already present: {len(terms) - len(missing)}")
    print(f"Missing: {len(missing)}")

    for offset, row in enumerate(missing, start=1):
        sheet.cell(row=last_data_row + offset, column=1, value=row["title"])

    if missing:
        wb.save(args.glossary_workbook)
        print(f"Saved {len(missing)} new terms to {args.glossary_workbook}")
    else:
        print("No workbook changes needed.")


if __name__ == "__main__":
    main()
