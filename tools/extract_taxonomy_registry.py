"""Extract a durable editorial taxonomy registry from a published corpus.

This tool promotes the curated (category, subCategory) decisions already baked
into a published term corpus into a standalone, reviewable registry. The build
script (tools/build_published_content.py) consumes the registry as the
authoritative taxonomy source, so the editorial record is the single source of
truth instead of a brittle derived keyword-rule layer.

Authority model (see Docs/decisions for the long-term rationale):
  - The published corpus is edited by people and records the intended taxonomy.
  - Re-deriving that taxonomy from keyword rules on every build is fragile and
    drifts from reality (the regression that motivated this tool).
  - The registry makes the editorial decisions first-class and reproducible.

Collision handling: the same normalized key (title or alias) can map to
different categories across terms (e.g. an alias shared by two concepts).
We resolve by majority vote across the source terms that own the key, with
the lexicographically smaller (category, subCategory) as the deterministic
tiebreaker so the output is stable across runs.

Usage:
    python3 tools/extract_taxonomy_registry.py \
        --corpus-dir public/content/published \
        --out data/taxonomy-registry.json
"""

from __future__ import annotations

import argparse
import collections
import importlib.util
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = REPO_ROOT / "tools" / "build_published_content.py"


def _load_normalize_key() -> "callable":
    """Reuse the build script's normalize_key so keys match the build exactly."""
    spec = importlib.util.spec_from_file_location("_bpc_for_keys", BUILD_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.normalize_key


def collect_taxonomy_from_corpus(corpus_dir: Path, normalize_key: "callable") -> dict:
    """Read every term shard and accumulate taxonomy votes per normalized key.

    Returns a dict: normalized_key -> Counter of (category, subCategory) votes,
    plus provenance (source term titles) for traceability.
    """
    shards_dir = corpus_dir / "terms" / "shards"
    if not shards_dir.is_dir():
        raise SystemExit(f"Expected term shards at {shards_dir}; run the build first.")

    votes: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    owners: dict[str, list[str]] = collections.defaultdict(list)

    shard_files = sorted(shards_dir.glob("*.json"))
    if not shard_files:
        raise SystemExit(f"No term shards found in {shards_dir}.")

    term_total = 0
    term_with_taxonomy = 0

    for shard_path in shard_files:
        payload = json.loads(shard_path.read_text(encoding="utf-8"))
        for term in payload.get("terms", []):
            term_total += 1
            taxonomy = term.get("taxonomy", {}) or {}
            category = taxonomy.get("category")
            if not category:
                continue
            term_with_taxonomy += 1
            sub_category = taxonomy.get("subCategory") or ""
            decision = (category, sub_category)

            keys = {normalize_key(term.get("title", ""))}
            for alias in term.get("aliases", []) or []:
                key = normalize_key(alias)
                if key:
                    keys.add(key)

            for key in keys:
                if not key:
                    continue
                votes[key][decision] += 1
                owners[key].append(term.get("title", ""))

    return {
        "votes": votes,
        "owners": owners,
        "termTotal": term_total,
        "termWithTaxonomy": term_with_taxonomy,
    }


def resolve_registry(collected: dict) -> dict:
    """Collapse votes into a single (category, subCategory) per key.

    Majority vote; deterministic tiebreaker on (category, subCategory).
    """
    registry: dict[str, dict] = {}
    collisions: list[dict] = []

    for key, counter in collected["votes"].items():
        winner = min(counter.items(), key=lambda kv: (-kv[1], kv[0]))[0]
        registry[key] = {
            "category": winner[0],
            "subCategory": winner[1],
        }
        # Record a collision when the top decision did not win outright.
        if len(counter) > 1:
            collisions.append(
                {
                    "key": key,
                    "owners": sorted(set(collected["owners"][key]))[:5],
                    "decisions": [
                        {"category": cat, "subCategory": sub, "votes": count}
                        for (cat, sub), count in counter.most_common()
                    ],
                }
            )

    return {
        "registry": registry,
        "collisions": collisions,
    }


def write_registry(out_path: Path, resolved: dict, collected: dict, corpus_dir: Path) -> dict:
    category_counts = collections.Counter()
    for entry in resolved["registry"].values():
        category_counts[entry["category"]] += 1

    payload = {
        "$schema": "https://aiglossary.dev/schemas/taxonomy-registry.v1.json",
        "kind": "taxonomy-registry",
        "description": (
            "Authoritative editorial taxonomy registry. Keyed by normalized term "
            "title/alias to (category, subCategory). Consumed by "
            "tools/build_published_content.py as the primary taxonomy source; "
            "auto-classification rules are a fallback for terms not present here. "
            "Regenerate via tools/extract_taxonomy_registry.py from a published corpus."
        ),
        "sourceCorpus": str(corpus_dir),
        "keyCount": len(resolved["registry"]),
        "categoryCounts": dict(sorted(category_counts.items())),
        "sourceTermTotal": collected["termTotal"],
        "sourceTermWithTaxonomy": collected["termWithTaxonomy"],
        "collisionCount": len(resolved["collisions"]),
        "entries": resolved["registry"],
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--corpus-dir", type=Path, default=REPO_ROOT / "public" / "content" / "published",
                        help="Published corpus root (default: public/content/published)")
    parser.add_argument("--out", type=Path, default=REPO_ROOT / "data" / "taxonomy-registry.json",
                        help="Output registry path (default: data/taxonomy-registry.json)")
    parser.add_argument("--collisions-out", type=Path, default=None,
                        help="Optional path to write the full collision audit JSON")
    args = parser.parse_args()

    normalize_key = _load_normalize_key()
    collected = collect_taxonomy_from_corpus(args.corpus_dir, normalize_key)
    resolved = resolve_registry(collected)
    payload = write_registry(args.out, resolved, collected, args.corpus_dir)

    if args.collisions_out:
        args.collisions_out.parent.mkdir(parents=True, exist_ok=True)
        args.collisions_out.write_text(
            json.dumps(resolved["collisions"], indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    coverage = payload["sourceTermWithTaxonomy"] / payload["sourceTermTotal"] if payload["sourceTermTotal"] else 0
    print(f"Wrote taxonomy registry: {args.out}")
    print(f"  source corpus:      {args.corpus_dir}")
    print(f"  source terms:       {payload['sourceTermTotal']}")
    print(f"  with taxonomy:      {payload['sourceTermWithTaxonomy']} ({coverage:.1%})")
    print(f"  registry keys:      {payload['keyCount']}")
    print(f"  categories:         {len(payload['categoryCounts'])}")
    print(f"  key collisions:     {payload['collisionCount']} (resolved by majority vote)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
