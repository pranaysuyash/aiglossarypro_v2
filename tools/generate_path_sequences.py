#!/usr/bin/env python3
"""Generate editorial path sequences for the top 20 learning paths.

This script examines the actual term pool for each path's (category, subcategory)
pair, applies keyword-based pedagogical ordering, and writes manual sequences
to editorial/path-sequences.json.

The build script checks this file and uses manual sequences when available
instead of the auto-generated alphabetical ordering.

Usage:
    python3 tools/generate_path_sequences.py
"""

from __future__ import annotations

import json
import re
import os
from pathlib import Path
from collections import defaultdict

NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    return NON_ALNUM_RE.sub("-", value.lower().strip()).strip("-")


# ── Keyword-based pedagogical ordering rules ──
# For each path, define keyword groups that identify foundational vs advanced terms.
# "start" keywords: terms containing these are pushed to the beginning.
# "advance" keywords: terms containing these are pushed to the end.
# Within each group, terms are sorted by featured status, then definition presence.

PATH_RULES: dict[str, dict] = {
    "neural-networks-core-models": {
        "category": "Neural Networks",
        "subcategory": "Core Models",
        "start_keywords": [
            "perceptron",  # Single perceptron is most basic
            "multilayer perceptron", "feedforward",  # MLP follows
            "neural network",  # General NN concept
            "deep learning",  # Broad field intro
        ],
        "advance_keywords": [
            "transformer-xl", "reformer", "performer", "linformer",
            "longformer", "bigbird", "sparse transformer",
            "neural turing", "differentiable neural",
            "highway network", "capsule",
        ],
    },
    "neural-networks-training-techniques": {
        "category": "Neural Networks",
        "subcategory": "Training Techniques",
        "start_keywords": ["backpropagation", "gradient descent", "sgd", "loss function"],
        "advance_keywords": [
            "distributed", "model parallel", "data parallel",
            "mixed precision", "fp16", "bf16",
            "gradient checkpoint", "gradient accumulation",
        ],
    },
    "neural-networks-attention-mechanism": {
        "category": "Neural Networks",
        "subcategory": "Attention Mechanism",
        "start_keywords": ["attention mechanism", "self attention", "attention is all"],
        "advance_keywords": [
            "linear attention", "sparse attention", "flash attention",
            "linformer", "performer", "reformer",
        ],
    },
    "neural-networks-recurrent-models": {
        "category": "Neural Networks",
        "subcategory": "Recurrent Models",
        "start_keywords": ["recurrent", "rnn"],
        "advance_keywords": [
            "convolutional lstm", "peephole", "attention lstm",
        ],
    },
    "neural-networks-advanced-architectures": {
        "category": "Neural Networks",
        "subcategory": "Advanced Architectures",
        "start_keywords": ["resnet", "residual", "inception", "wide"],
        "advance_keywords": [
            "sparse", "mixture of experts", "neural architecture search", "nas",
            "progressive", "evolved",
        ],
    },
    "neural-networks-specialized-architectures": {
        "category": "Neural Networks",
        "subcategory": "Specialized Architectures",
        "start_keywords": ["capsule", "memory", "neural turing"],
        "advance_keywords": [
            "transformer-xl", "reformer", "performer", "rwkv",
            "mamba", "state space",
        ],
    },
    "natural-language-processing-text-preprocessing": {
        "category": "Natural Language Processing",
        "subcategory": "Text Preprocessing",
        "start_keywords": ["tokenization", "tokenizer", "stemming", "lemmatization"],
        "advance_keywords": ["byte pair", "wordpiece", "sentencepiece", "subword"],
    },
    "natural-language-processing-text-analysis": {
        "category": "Natural Language Processing",
        "subcategory": "Text Analysis",
        "start_keywords": ["bag of words", "bow", "tf-idf", "n-gram"],
        "advance_keywords": [
            "transformer", "bert", "attention", "language model",
        ],
    },
    "natural-language-processing-language-generation": {
        "category": "Natural Language Processing",
        "subcategory": "Language Generation",
        "start_keywords": ["language model", "n-gram language"],
        "advance_keywords": [
            "gpt", "transformer", "decoder only",
            "top k", "top p", "temperature", "nucleus",
        ],
    },
    "natural-language-processing-pre-trained-models": {
        "category": "Natural Language Processing",
        "subcategory": "Pre-trained Models",
        "start_keywords": ["word2vec", "glove", "fasttext", "embedding"],
        "advance_keywords": [
            "instruction tuning", "rlhf", "dpo", "constitutional",
            "superalignment", "prompt tuning", "p tuning",
        ],
    },
    "computer-vision-image-processing": {
        "category": "Computer Vision",
        "subcategory": "Image Processing",
        "start_keywords": ["filter", "convolution", "edge detection", "sobel"],
        "advance_keywords": [
            "transformer", "vit", "attention", "swin",
            "generative", "gan",
        ],
    },
    "computer-vision-core-models": {
        "category": "Computer Vision",
        "subcategory": "Core Models",
        "start_keywords": ["lenet", "alexnet", "vgg", "cnn"],
        "advance_keywords": [
            "transformer", "vit", "clip", "dinov2", "moco",
            "simmim", "mae",
        ],
    },
    "computer-vision-object-detection": {
        "category": "Computer Vision",
        "subcategory": "Object Detection",
        "start_keywords": ["rcnn", "fast rcnn", "yolo", "ssd"],
        "advance_keywords": ["detr", "transformer", "dino", "yolov8", "yolox"],
    },
    "reinforcement-learning-advanced-rl-techniques": {
        "category": "Reinforcement Learning",
        "subcategory": "Advanced RL Techniques",
        "start_keywords": ["q learning", "deep q", "dqn", "policy gradient", "reinforce"],
        "advance_keywords": ["multi agent", "offline rl", "iql", "cql", "muzero", "alphazero"],
    },
    "foundations-core-concepts": {
        "category": "Foundations",
        "subcategory": "Core Concepts",
        "start_keywords": [
            "machine learning", "supervised learning", "unsupervised",
            "artificial intelligence",
        ],
        "advance_keywords": [
            "overfitting", "underfitting", "bias variance", "regularization",
            "dimension", "evaluation",
        ],
    },
    "optimization-algorithms-gradient-based-optimizers": {
        "category": "Optimization Algorithms",
        "subcategory": "Gradient-based Optimizers",
        "start_keywords": [
            "gradient descent", "sgd", "stochastic gradient",
            "batch gradient",
        ],
        "advance_keywords": [
            "adamw", "lamb", "adafactor", "shampoo",
            "learning rate warmup", "cosine annealing",
        ],
    },
    "generative-models-diffusion-models": {
        "category": "Generative Models",
        "subcategory": "Diffusion Models",
        "start_keywords": ["diffusion model", "denoising diffusion", "ddpm"],
        "advance_keywords": [
            "consistency model", "flow matching", "rectified flow",
            "video diffusion", "text to video", "sora",
        ],
    },
    "data-preprocessing-data-enhancement": {
        "category": "Data Preprocessing",
        "subcategory": "Data Enhancement",
        "start_keywords": ["feature engineering", "feature selection", "feature extraction"],
        "advance_keywords": [
            "augmentation", "smote", "synthetic",
            "automated feature", "autofeat",
        ],
    },
    "learning-paradigms-supervised-learning": {
        "category": "Learning Paradigms",
        "subcategory": "Supervised Learning",
        "start_keywords": ["regression", "classification", "linear", "logistic"],
        "advance_keywords": [
            "gradient boosting", "xgboost", "catboost", "lightgbm",
            "deep learning",
        ],
    },
    "ensemble-methods-tree-based-models": {
        "category": "Ensemble Methods",
        "subcategory": "Tree-Based Models",
        "start_keywords": [
            "decision tree", "random forest", "bagging",
        ],
        "advance_keywords": [
            "xgboost", "lightgbm", "catboost", "gradient boosting",
            "stacking", "blending",
        ],
    },
    "transfer-learning-model-adaptation": {
        "category": "Transfer Learning",
        "subcategory": "Model Adaptation",
        "start_keywords": [
            "transfer learning", "fine tuning", "domain adaptation",
        ],
        "advance_keywords": [
            "lora", "qlora", "adapter", "prefix tuning", "prompt tuning",
            "p tuning", "ia3",
        ],
    },
}


def compute_term_score(term: dict, title_lower: str, start_keywords: list[str], advance_keywords: list[str]) -> float:
    """Score a term for pedagogical ordering.

    Higher scores = more foundational (should appear earlier).
    Lower scores = more advanced (should appear later).

    Factors:
    - +50 if featured
    - +25 if has definition
    - +10 per link (capped at 40)
    - +100 if matches a start keyword
    - -50 if matches an advance keyword
    """
    featured = 1 if term["metadata"]["editorialTier"] == "featured" else 0
    has_def = 1 if term["source"]["glossaryWorkbook"]["definitionRow"] else 0
    link_count = sum(len(term["links"][k]) for k in ["prerequisites", "related", "alternatives", "next"])

    score = featured * 50 + has_def * 25 + min(link_count, 4) * 10

    # Check start keywords
    for kw in start_keywords:
        if kw.lower() in title_lower:
            score += 100
            break

    # Check advance keywords
    for kw in advance_keywords:
        if kw.lower() in title_lower:
            score -= 50
            break

    return score


def generate_why(title: str, stage: str, has_def: bool, link_count: int, sub: str) -> str:
    """Generate a context-aware whyIncluded text."""
    if stage == "start":
        if has_def:
            return f"A foundational concept in {sub} — start here to build vocabulary and core intuition before moving to techniques and extensions."
        else:
            return f"Establish the core vocabulary for {sub}. Start here to anchor your understanding of this area."
    elif stage == "build":
        if link_count >= 4:
            return f"Builds on earlier terms to connect patterns and variants in {sub}. The concept graph makes it a useful bridge to specialized methods."
        elif has_def:
            return f"Expands the {sub} toolkit. Use this after the foundations to see how the area branches into practical techniques."
        else:
            return f"Expands into practical techniques within {sub}. Work through this after the foundational terms are comfortable."
    else:
        if has_def:
            return f"An advanced extension of {sub}. Tackle this after the foundational and intermediate terms feel natural."
        else:
            return f"A specialized concept in {sub}. Treat this as an advanced extension once the earlier terms are solid."


def main() -> None:
    # ── Load all term records from shards ──
    shard_dir = Path("public/content/published/terms/shards")
    all_records: dict[str, dict] = {}
    for f in sorted(os.listdir(shard_dir)):
        if not f.endswith(".json"):
            continue
        shard = json.loads((shard_dir / f).read_text(encoding="utf-8"))
        if isinstance(shard, dict) and "terms" in shard:
            for t in shard["terms"]:
                all_records[t["slug"]] = t

    print(f"Loaded {len(all_records)} term records.")
    print()

    # ── Group terms by (category, subcategory) ──
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for t in all_records.values():
        cat = t["taxonomy"]["category"]
        sub = t["taxonomy"]["subCategory"]
        if cat and sub:
            groups[(cat, sub)].append(t)

    # ── Build manual sequences ──
    path_sequences: dict[str, dict] = {}

    for path_slug, rules in sorted(PATH_RULES.items()):
        cat = rules["category"]
        sub = rules["subcategory"]
        start_kw = rules["start_keywords"]
        advance_kw = rules["advance_keywords"]

        terms = groups.get((cat, sub), [])
        if len(terms) < 3:
            print(f"  SKIP: {path_slug} — only {len(terms)} terms in {cat}/{sub}")
            continue

        # Score and sort each term
        scored: list[tuple[float, str, dict]] = []
        for t in terms:
            title_lower = t["title"].lower()
            score = compute_term_score(t, title_lower, start_kw, advance_kw)
            scored.append((score, t["title"].lower(), t))

        # Sort by score descending, then alphabetically for ties
        scored.sort(key=lambda x: (-x[0], x[1]))

        # Select top 8, avoiding near-duplicate terms
        selected: list[dict] = []
        seen_stems: set[str] = set()

        for score, _, term in scored:
            if len(selected) >= 8:
                break
            # Avoid near-duplicates by checking if the first 3 words of the title
            # match an already-selected term
            title_words = term["title"].lower().split()[:3]
            stem = " ".join(title_words)
            if stem in seen_stems:
                continue
            seen_stems.add(stem)
            selected.append(term)

        if len(selected) < 3:
            print(f"  SKIP: {path_slug} — only {len(selected)} selected (after dedup) in {cat}/{sub}")
            continue

        # Assign stages and generate whyIncluded text
        steps = []
        for i, term in enumerate(selected):
            total = len(selected)
            if i < 2:
                stage = "start"
            elif i < min(5, total - 1):
                stage = "build"
            else:
                stage = "advance"

            has_def = bool(term["source"]["glossaryWorkbook"]["definitionRow"])
            link_count = sum(len(term["links"][k]) for k in ["prerequisites", "related", "alternatives", "next"])
            why = generate_why(term["title"], stage, has_def, link_count, sub)

            steps.append(
                {
                    "slug": term["slug"],
                    "title": term["title"],
                    "stage": stage,
                    "why": why,
                }
            )

        path_sequences[path_slug] = {
            "steps": steps,
            "category": cat,
            "subCategory": sub,
        }
        print(f"  {path_slug:55s} {len(selected):2d} steps  (from {len(terms):4d} terms)")

        # Show the sequence
        for i, s in enumerate(steps):
            print(f"    {i+1}. [{s['stage']:8s}] {s['title'][:55]}")

    # ── Write the data file ──
    output_path = Path("public/content/published/editorial/path-sequences.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(path_sequences, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    total_steps = sum(len(p["steps"]) for p in path_sequences.values())
    print(f"\n✅ Wrote {len(path_sequences)} path sequences ({total_steps} steps) to {output_path}")


if __name__ == "__main__":
    main()
