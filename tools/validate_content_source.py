#!/usr/bin/env python3
"""Validate the diffable content-source snapshot."""

from __future__ import annotations

import argparse
from pathlib import Path

from content_source_utils import read_jsonl, validate_source_terms


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--terms", type=Path, default=Path("content/source/terms.jsonl"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rows = read_jsonl(args.terms)
    issues = validate_source_terms(rows)
    if issues:
        for issue in issues[:50]:
            subject = f" {issue.term_id}" if issue.term_id else ""
            print(f"{issue.code}{subject}: {issue.message}")
        if len(issues) > 50:
            print(f"... {len(issues) - 50} more issues")
        return 1
    print(f"Validated {len(rows)} content source terms")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
