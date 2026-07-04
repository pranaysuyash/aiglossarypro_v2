#!/usr/bin/env python3
"""Shared helpers for diffable content-source snapshots.

The published corpus is runtime output. These helpers create and validate the
reviewable source-control layer that records stable identity, source provenance,
and artifact hashes for each term.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

SOURCE_SCHEMA_VERSION = "content-source-term.v1"
SOURCE_MANIFEST_SCHEMA_VERSION = "content-source-manifest.v1"
CONTENT_VERSION = "2026.07.04-source-v1"

_WHITESPACE_RE = re.compile(r"\s+")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")
_TOKEN_RE = re.compile(r"[a-z0-9]+")


def normalize_label(value: object | None) -> str:
    if value is None:
        return ""
    return _WHITESPACE_RE.sub(" ", str(value).strip())


def semantic_key(value: object | None) -> str:
    text = normalize_label(value).lower()
    text = text.replace("&", " and ").replace("+", " plus ")
    tokens = _TOKEN_RE.findall(text)
    return " ".join(tokens)


def slugify(value: object | None) -> str:
    key = _NON_ALNUM_RE.sub("-", normalize_label(value).lower()).strip("-")
    return key or "untitled"


def stable_term_id(title: str, disambiguator: str | None = None) -> str:
    key = semantic_key(title)
    identity_key = f"{key}|{disambiguator}" if disambiguator else key
    digest = hashlib.sha256(identity_key.encode("utf-8")).hexdigest()[:16]
    return f"term_{digest}"


def stable_hash(payload: Any) -> str:
    encoded = json.dumps(payload, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=True, sort_keys=True, indent=2) + "\n", encoding="utf-8")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            payload = json.loads(stripped)
            if not isinstance(payload, dict):
                raise ValueError(f"{path}:{line_number} is not a JSON object")
            rows.append(payload)
    return rows


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=True, sort_keys=True, separators=(",", ":")) + "\n")


def term_signature(row: dict[str, Any]) -> str:
    comparable = {
        "title": row.get("title"),
        "aliases": row.get("aliases", []),
        "taxonomy": row.get("taxonomy", {}),
        "metadata": row.get("metadata", {}),
        "source": row.get("source", {}),
        "publishedContentHash": row.get("publishedContentHash"),
    }
    return stable_hash(comparable)


@dataclass(frozen=True)
class ValidationIssue:
    code: str
    message: str
    term_id: str | None = None


def validate_source_terms(rows: list[dict[str, Any]]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    seen_ids: set[str] = set()
    seen_slugs: set[str] = set()

    for index, row in enumerate(rows, start=1):
        term_id = row.get("termId") if isinstance(row.get("termId"), str) else None
        prefix = f"row {index}"
        if row.get("schemaVersion") != SOURCE_SCHEMA_VERSION:
            issues.append(ValidationIssue("schema_version", f"{prefix} has invalid schemaVersion", term_id))
        if not term_id:
            issues.append(ValidationIssue("term_id_missing", f"{prefix} is missing termId", None))
        elif term_id in seen_ids:
            issues.append(ValidationIssue("term_id_duplicate", f"{prefix} duplicates termId {term_id}", term_id))
        else:
            seen_ids.add(term_id)

        title = row.get("title")
        canonical_slug = row.get("canonicalSlug")
        status = row.get("status")
        if not isinstance(title, str) or not title.strip():
            issues.append(ValidationIssue("title_missing", f"{prefix} is missing title", term_id))
        if not isinstance(canonical_slug, str) or not canonical_slug.strip():
            issues.append(ValidationIssue("slug_missing", f"{prefix} is missing canonicalSlug", term_id))
        elif canonical_slug in seen_slugs:
            issues.append(ValidationIssue("slug_duplicate", f"{prefix} duplicates canonicalSlug {canonical_slug}", term_id))
        else:
            seen_slugs.add(canonical_slug)
        if status not in {"active", "deprecated", "removed", "merged"}:
            issues.append(ValidationIssue("status_invalid", f"{prefix} has invalid status {status!r}", term_id))
        if not isinstance(row.get("slugHistory"), list) or canonical_slug not in row.get("slugHistory", []):
            issues.append(ValidationIssue("slug_history", f"{prefix} slugHistory must include canonicalSlug", term_id))
        if not isinstance(row.get("sourceKey"), str) or not row.get("sourceKey"):
            issues.append(ValidationIssue("source_key_missing", f"{prefix} is missing sourceKey", term_id))
        if not isinstance(row.get("revision"), int) or row.get("revision") < 1:
            issues.append(ValidationIssue("revision_invalid", f"{prefix} revision must be a positive integer", term_id))
        if not isinstance(row.get("contentHash"), str) or len(row.get("contentHash", "")) != 64:
            issues.append(ValidationIssue("content_hash_invalid", f"{prefix} contentHash must be a SHA-256 hex digest", term_id))

    return issues


def build_source_manifest(rows: list[dict[str, Any]], source_files: dict[str, Path]) -> dict[str, Any]:
    active_rows = [row for row in rows if row.get("status") == "active"]
    source_hashes = {name: file_sha256(path) for name, path in sorted(source_files.items()) if path.exists()}
    row_hashes = {row["termId"]: row["contentHash"] for row in rows}
    return {
        "schemaVersion": SOURCE_MANIFEST_SCHEMA_VERSION,
        "contentVersion": CONTENT_VERSION,
        "termCount": len(rows),
        "activeTermCount": len(active_rows),
        "removedTermCount": sum(1 for row in rows if row.get("status") == "removed"),
        "deprecatedTermCount": sum(1 for row in rows if row.get("status") == "deprecated"),
        "mergedTermCount": sum(1 for row in rows if row.get("status") == "merged"),
        "sourceHashes": source_hashes,
        "sourceRowsHash": stable_hash(row_hashes),
        "artifacts": {
            "terms": "content/source/terms.jsonl",
            "manifest": "content/source/content-lock.json",
            "slugHistory": "content/migrations/slug-history.json",
        },
    }
