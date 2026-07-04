#!/usr/bin/env python3
"""Diff two content-source snapshots by stable term identity."""

from __future__ import annotations

import argparse
from pathlib import Path

from content_source_utils import read_jsonl, term_signature


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    parser.add_argument("--fail-removals-without-tombstone", action="store_true")
    return parser.parse_args()


def index_rows(path: Path) -> dict[str, dict]:
    return {row["termId"]: row for row in read_jsonl(path)}


def main() -> int:
    args = parse_args()
    before = index_rows(args.before)
    after = index_rows(args.after)
    before_ids = set(before)
    after_ids = set(after)
    added = sorted(after_ids - before_ids)
    removed = sorted(before_ids - after_ids)
    changed = sorted(term_id for term_id in before_ids & after_ids if term_signature(before[term_id]) != term_signature(after[term_id]))
    tombstoned = sorted(
        term_id for term_id in before_ids & after_ids if before[term_id].get("status") == "active" and after[term_id].get("status") in {"removed", "merged", "deprecated"}
    )

    print(f"added={len(added)}")
    print(f"removed={len(removed)}")
    print(f"changed={len(changed)}")
    print(f"tombstoned={len(tombstoned)}")
    for label, ids in (("added", added[:20]), ("removed", removed[:20]), ("changed", changed[:20]), ("tombstoned", tombstoned[:20])):
        for term_id in ids:
            row = after.get(term_id) or before.get(term_id) or {}
            print(f"{label}: {term_id} {row.get('title', '')}")

    if args.fail_removals_without_tombstone and removed:
        print("ERROR: removals must be represented as status=removed/merged/deprecated tombstones, not missing rows")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
