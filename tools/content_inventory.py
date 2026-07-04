#!/usr/bin/env python3
"""Report content-system inventory across source and published layers."""

from __future__ import annotations

import argparse
from pathlib import Path

from content_source_utils import load_json, read_jsonl


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--published-dir", type=Path, default=Path("public/content/published"))
    parser.add_argument("--source-terms", type=Path, default=Path("content/source/terms.jsonl"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    published_manifest = load_json(args.published_dir / "manifest.json")
    source_rows = read_jsonl(args.source_terms) if args.source_terms.exists() else []
    active_source = [row for row in source_rows if row.get("status") == "active"]
    print("Content inventory")
    print(f"published.termCount={published_manifest.get('termCount')}")
    print(f"published.pathCount={published_manifest.get('pathCount')}")
    print(f"published.status={published_manifest.get('status')}")
    print(f"source.termCount={len(source_rows)}")
    print(f"source.activeTermCount={len(active_source)}")
    print(f"source.removedTermCount={sum(1 for row in source_rows if row.get('status') == 'removed')}")
    print(f"source.deprecatedTermCount={sum(1 for row in source_rows if row.get('status') == 'deprecated')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
