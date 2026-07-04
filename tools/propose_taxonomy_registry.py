#!/usr/bin/env python3
"""Propose taxonomy classifications for unclassified terms.

Uses three signals to propose (category, subCategory) for each unclassified term:

1. Token similarity — tokenize each unclassified term and find which categories
   the same tokens appear in among the 13k+ already-classified terms.
2. StudyFamily metadata — maps detected study families to concrete categories.
3. Named-entity heuristics — dataset → Data Processing, tool → ML Frameworks, etc.

Output: JSON file with proposed entries that can be reviewed and merged into
data/taxonomy-registry.json.

Usage:
    .venv/bin/python3 tools/propose_taxonomy_registry.py \
        --terms-index /tmp/editorial-baseline/terms/index.json \
        --registry data/taxonomy-registry.json \
        --out /tmp/proposed-registry-entries.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# Import tokenization from the canonical build script to guarantee parity
from build_published_content import normalize_key, semantic_tokens


# ── Named entity heuristics ─────────────────────────────────────────────────

DATASET_KEYWORDS = {
    "dataset", "data set", "benchmark", "corpus", "collection", "catalog",
}
TOOL_KEYWORDS = {
    "tool", "framework", "library", "sdk", "api", "platform", "package",
    "middleware", "engine", "orchestrator", "pipeline",
}
VENDOR_NAMES = {
    "nvidia", "google", "amazon", "microsoft", "meta", "apple", "ibm",
    "openai", "intel", "amd", "qualcomm", "arm", "tesla", "deepmind",
    "anthropic", "huggingface",
}
PAPER_KEYWORDS = {
    "paper", "article", "publication", "preprint", "arxiv",
}


def is_dataset_like(title: str) -> bool:
    low = title.lower()
    return any(kw in low for kw in DATASET_KEYWORDS)


def is_tool_like(title: str) -> bool:
    low = title.lower()
    return any(kw in low for kw in TOOL_KEYWORDS)


def is_vendor_like(title: str) -> bool:
    """Check if title contains a known vendor name as a whole word.

    Uses word-boundary matching to avoid false positives like
    "warmup" matching vendor "arm" or "application" matching vendor "apple".
    """
    low = title.lower()
    for vendor in VENDOR_NAMES:
        # Word-boundary pattern: vendor name surrounded by non-alphanumeric or string edges
        if re.search(rf'(?<![a-z0-9]){re.escape(vendor)}(?![a-z0-9])', low):
            return True
    return False


# ── StudyFamily mapping (same as build_published_content.py) ─────────────────

STUDY_FAMILY_TAXONOMY_MAP: dict[str, tuple[str, str]] = {
    "Evaluation": ("Model Evaluation", "Performance Metrics"),
    "Ethics & Governance": ("Ethics & Governance", "Fairness in ML"),
    "Statistics": ("Statistical Methods", "Bayesian Inference"),
    "Similarity & Deduplication": ("Similarity & Deduplication", ""),
}


# ── Token-based category inference ──────────────────────────────────────────

def build_token_category_index(
    registry_entries: dict[str, dict],
) -> tuple[dict[str, Counter], dict[str, Counter]]:
    """Build a token→category index from existing registry entries.

    Each token accumulates weighted votes for the categories it appears in.
    Returns (token_category_counts, token_subcategory_counts).
    """
    token_category: dict[str, Counter] = defaultdict(Counter)
    token_subcategory: dict[str, Counter] = defaultdict(Counter)

    for term_key, entry in registry_entries.items():
        category = entry.get("category", "")
        subcategory = entry.get("subCategory", "")
        tokens = set(semantic_tokens(term_key))
        for token in tokens:
            if len(token) >= 2:
                token_category[token][category] += 1
                if subcategory:
                    token_subcategory[token][subcategory] += 1

    return dict(token_category), dict(token_subcategory)


STOPWORDS = {
    "the", "of", "and", "in", "for", "to", "a", "an", "with", "using", "via",
    "based", "on", "by", "from", "at", "as", "is", "or", "not", "are", "its",
    "their", "this", "that", "was", "were", "been", "be", "has", "have", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "can", "shall", "about", "into", "through", "during", "before", "after",
    "above", "below", "between", "out", "off", "over", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
    "very", "just", "because", "as", "until", "while", "if",
}


def infer_category_from_tokens(
    title: str,
    aliases: list[str],
    token_category_index: dict[str, Counter],
    token_subcategory_index: dict[str, Counter],
    token_specificity: dict[str, int],
) -> tuple[str, str, float, dict[str, int]]:
    """Infer the best category for a term based on token overlap with classified terms.

    Confidence is weighted by token specificity — a token that appears in few
    categories (e.g. "bayesian" → 2 categories) is a stronger signal than a
    token that appears in many (e.g. "learning" → 50 categories).

    Returns (category, subcategory, confidence_score, voting_breakdown).
    """
    all_titles = [title] + aliases
    all_tokens: set[str] = set()
    for t in all_titles:
        all_tokens.update(semantic_tokens(t))

    meaningful = {t for t in all_tokens if t not in STOPWORDS and len(t) >= 3}
    if not meaningful:
        return "", "", 0.0, {}

    category_votes: Counter[str] = Counter()
    subcategory_votes: Counter[str] = Counter()
    voting_tokens = 0
    total_specificity_weight = 0.0

    for token in meaningful:
        if token in token_category_index:
            specificity = max(1, token_specificity.get(token, 50))
            weight = 1.0 / specificity
            for cat, count in token_category_index[token].most_common(3):
                category_votes[cat] += count * weight
            voting_tokens += 1
            total_specificity_weight += weight

        if token in token_subcategory_index:
            for sub, count in token_subcategory_index[token].most_common(3):
                subcategory_votes[sub] += count

    if not category_votes:
        # Retry with shorter tokens (length >= 2)
        for token in meaningful:
            if len(token) >= 2 and token in token_category_index:
                specificity = max(1, token_specificity.get(token, 50))
                weight = 1.0 / specificity
                for cat, count in token_category_index[token].most_common(3):
                    category_votes[cat] += count * weight
                if voting_tokens == 0:
                    total_specificity_weight += weight
                voting_tokens += 1

    if not category_votes:
        return "", "", 0.0, {}

    best_category = category_votes.most_common(1)[0][0]
    best_subcategory = subcategory_votes.most_common(1)[0][0] if subcategory_votes else ""

    # Confidence: fraction of meaningful tokens that had any votes × specificity weight
    # The ×3 factor means tokens in 3+ categories start to lose weight, so generic
    # tokens like "model" (appears in ~50 categories) get 1/50 * 3 = 0.06 vs
    # specific tokens like "bayesian" (appears in ~2 categories) get 1/2 * 3 = 1.5→1.0.
    confidence = min(1.0, (voting_tokens / max(1, len(meaningful))) * min(1.0, total_specificity_weight / max(1, voting_tokens) * 3))

    breakdown = {cat: int(round(vote)) for cat, vote in category_votes.most_common(5)}

    return best_category, best_subcategory, confidence, breakdown


# ── Heuristic-based classification ──────────────────────────────────────────

def classify_by_heuristic(title: str, study_family: str) -> tuple[str, str, str]:
    """Try to classify a term using named-entity heuristics.

    Heuristic priority:
    1. StudyFamily mapping (most authoritative — zero false-positive risk)
    2. Dataset/benchmark keywords
    3. Tool/framework/SDK keywords
    4. Vendor/organization names

    Returns (category, subcategory, source_tag) or ("", "", "").
    """
    lower = title.lower()

    # StudyFamily mapping (highest confidence, zero false-positive risk)
    if study_family in STUDY_FAMILY_TAXONOMY_MAP:
        cat, sub = STUDY_FAMILY_TAXONOMY_MAP[study_family]
        return cat, sub, "study_family"

    # Dataset/benchmark → Data Processing
    if is_dataset_like(title):
        return "Data Processing", "Data Pipeline", "heuristic_dataset"

    # Tool/framework/SDK → ML Frameworks
    if is_tool_like(title):
        return "Machine Learning Frameworks", "Automated Processes", "heuristic_tool"

    # Vendor/organization → AI Applications
    if is_vendor_like(title):
        return "AI Applications", "", "heuristic_vendor"

    return "", "", ""


# ── Main pipeline ───────────────────────────────────────────────────────────

def build_token_specificity(token_category_index: dict[str, Counter]) -> dict[str, int]:
    """Count how many distinct categories each token appears in.

    Higher counts = more generic tokens = lower specificity weight.
    """
    specificity: dict[str, int] = {}
    for token, cat_counter in token_category_index.items():
        specificity[token] = len(cat_counter)
    return specificity


def propose_classifications(
    terms: list[dict],
    registry_entries: dict[str, dict],
) -> tuple[list[dict], list[dict]]:
    """Propose classifications for all unclassified terms.

    Returns (high_confidence_proposals, low_confidence_proposals).
    """
    token_cat, token_sub = build_token_category_index(registry_entries)
    token_specificity = build_token_specificity(token_cat)

    high_confidence: list[dict] = []
    low_confidence: list[dict] = []

    # Pre-compute registry keys for fast dedup
    existing_keys = set(registry_entries.keys())

    for term in terms:
        title = term["title"]
        key = normalize_key(title)
        # Skip terms already in the registry — they already have an authoritative entry
        if key in existing_keys:
            continue
        aliases = term.get("aliases", [])
        study_family = term.get("metadata", {}).get("studyFamily", "")

        proposal: dict = {
            "termKey": key,
            "title": title,
            "studyFamily": study_family,
            "category": "",
            "subCategory": "",
            "confidence": 0.0,
            "source": "",
            "votingBreakdown": {},
        }

        # Try heuristics first (higher precision)
        cat, sub, source = classify_by_heuristic(title, study_family)
        if source:
            proposal["category"] = cat
            proposal["subCategory"] = sub
            proposal["source"] = source
            proposal["confidence"] = 0.9 if source == "study_family" else 0.7
            high_confidence.append(proposal)
            continue

        # Token similarity
        cat, sub, confidence, breakdown = infer_category_from_tokens(
            title, aliases, token_cat, token_sub, token_specificity
        )
        if cat and confidence >= 0.35:
            proposal["category"] = cat
            proposal["subCategory"] = sub
            proposal["confidence"] = round(confidence, 4)
            proposal["source"] = "token_similarity"
            proposal["votingBreakdown"] = breakdown
            high_confidence.append(proposal)
        elif cat:
            proposal["category"] = cat
            proposal["subCategory"] = sub
            proposal["confidence"] = round(confidence, 4)
            proposal["source"] = "token_similarity"
            proposal["votingBreakdown"] = breakdown
            low_confidence.append(proposal)
        else:
            low_confidence.append(proposal)

    return high_confidence, low_confidence


def proposals_to_registry_entries(proposals: list[dict]) -> dict[str, dict]:
    """Convert proposals into the taxonomy registry entries format."""
    entries: dict[str, dict] = {}
    for p in proposals:
        key = p["termKey"]
        if not key or not p["category"]:
            continue
        entries[key] = {
            "category": p["category"],
            "subCategory": p["subCategory"],
        }
    return entries


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Propose taxonomy classifications for unclassified terms"
    )
    parser.add_argument(
        "--terms-index",
        required=True,
        type=str,
        help="Path to terms/index.json from the build output",
    )
    parser.add_argument(
        "--registry",
        default="data/taxonomy-registry.json",
        type=str,
        help="Path to the existing taxonomy registry (for training data)",
    )
    parser.add_argument(
        "--out",
        default="/tmp/proposed-registry-entries.json",
        type=str,
        help="Output path for proposed entries",
    )
    parser.add_argument(
        "--limit",
        default=0,
        type=int,
        help="Max number of terms to process (0 = all)",
    )
    parser.add_argument(
        "--merge-file",
        default="",
        type=str,
        help="If set, write a taxonomy-registry-compatible JSON file ready for merging",
    )
    args = parser.parse_args()

    # Load terms
    terms_path = Path(args.terms_index)
    if not terms_path.is_file():
        print(f"Error: terms index not found: {args.terms_index}", file=sys.stderr)
        return 1

    all_terms = json.loads(terms_path.read_text(encoding="utf-8"))
    unclassified = [t for t in all_terms if not t.get("taxonomy", {}).get("category")]
    print(f"Loaded {len(all_terms)} terms, {len(unclassified)} unclassified")

    # Load registry
    registry_path = Path(args.registry)
    if not registry_path.is_file():
        print(f"Error: registry not found: {args.registry}", file=sys.stderr)
        return 1

    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    registry_entries = registry.get("entries", {})
    print(f"Loaded registry with {len(registry_entries)} entries")

    # Limit if requested
    if args.limit > 0:
        unclassified = unclassified[:args.limit]
        print(f"Limited to {len(unclassified)} terms")

    # Propose
    high_conf, low_conf = propose_classifications(unclassified, registry_entries)

    print(f"\nProposals: {len(high_conf)} high-confidence, {len(low_conf)} low-confidence")

    # Summary by source
    source_counts: Counter[str] = Counter()
    for p in high_conf:
        source_counts[p["source"]] += 1
    if source_counts:
        print(f"\nHigh-confidence by source:")
        for source, count in source_counts.most_common():
            print(f"  {source}: {count}")

    # Summary by category
    cat_counts: Counter[str] = Counter()
    for p in high_conf:
        cat_counts[p["category"]] += 1
    if cat_counts:
        print(f"\nHigh-confidence by category (top 15):")
        for cat, count in cat_counts.most_common(15):
            print(f"  {cat}: {count}")

    # Write output
    output = {
        "metadata": {
            "totalTerms": len(all_terms),
            "unclassifiedTerms": len(unclassified),
            "registryEntries": len(registry_entries),
            "highConfidenceCount": len(high_conf),
            "lowConfidenceCount": len(low_conf),
        },
        "highConfidenceProposals": high_conf,
        "lowConfidenceProposals": low_conf,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(output, ensure_ascii=True, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\nWritten to: {args.out}")

    # Write merge-ready format if requested
    if args.merge_file:
        entries = proposals_to_registry_entries(high_conf)
        merge_output = {
            "kind": "taxonomy-registry-merge",
            "description": f"Proposed classifications for {len(high_conf)} unclassified terms. Review and merge into data/taxonomy-registry.json",
            "entries": entries,
        }
        merge_path = Path(args.merge_file)
        merge_path.write_text(
            json.dumps(merge_output, ensure_ascii=True, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Merge-ready output written to: {args.merge_file}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
