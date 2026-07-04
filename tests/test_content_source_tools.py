import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from tools.content_source_utils import (
    SOURCE_SCHEMA_VERSION,
    build_source_manifest,
    stable_term_id,
    validate_source_terms,
    write_json,
    write_jsonl,
)


REPO_ROOT = Path(__file__).resolve().parents[1]
PYTHON = REPO_ROOT / ".venv" / "bin" / "python3"


class ContentSourceToolsTests(unittest.TestCase):
    def test_stable_term_id_uses_disambiguator_only_for_collisions(self) -> None:
        base = stable_term_id("Gradient Descent")
        self.assertEqual(base, stable_term_id("Gradient   Descent"))
        self.assertNotEqual(base, stable_term_id("Gradient Descent", "gradient-descent-2"))

    def test_validate_source_terms_requires_tombstone_ready_identity_contract(self) -> None:
        rows = [
            {
                "schemaVersion": SOURCE_SCHEMA_VERSION,
                "termId": "term_abc",
                "status": "active",
                "revision": 1,
                "sourceKey": "activation function",
                "title": "Activation Function",
                "canonicalSlug": "activation-function",
                "slugHistory": ["activation-function"],
                "contentHash": "a" * 64,
            },
            {
                "schemaVersion": SOURCE_SCHEMA_VERSION,
                "termId": "term_abc",
                "status": "active",
                "revision": 1,
                "sourceKey": "activation function duplicate",
                "title": "Activation Function Duplicate",
                "canonicalSlug": "activation-function-duplicate",
                "slugHistory": ["activation-function-duplicate"],
                "contentHash": "b" * 64,
            },
        ]

        issues = validate_source_terms(rows)
        self.assertIn("term_id_duplicate", {issue.code for issue in issues})

    def test_content_diff_flags_missing_removal_without_tombstone(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            before = tmp_path / "before.jsonl"
            after = tmp_path / "after.jsonl"
            write_jsonl(
                before,
                [
                    {
                        "schemaVersion": SOURCE_SCHEMA_VERSION,
                        "termId": "term_keep",
                        "status": "active",
                        "revision": 1,
                        "sourceKey": "keep",
                        "title": "Keep",
                        "canonicalSlug": "keep",
                        "slugHistory": ["keep"],
                        "contentHash": "a" * 64,
                    },
                    {
                        "schemaVersion": SOURCE_SCHEMA_VERSION,
                        "termId": "term_remove",
                        "status": "active",
                        "revision": 1,
                        "sourceKey": "remove",
                        "title": "Remove",
                        "canonicalSlug": "remove",
                        "slugHistory": ["remove"],
                        "contentHash": "b" * 64,
                    },
                ],
            )
            write_jsonl(
                after,
                [
                    {
                        "schemaVersion": SOURCE_SCHEMA_VERSION,
                        "termId": "term_keep",
                        "status": "active",
                        "revision": 1,
                        "sourceKey": "keep",
                        "title": "Keep",
                        "canonicalSlug": "keep",
                        "slugHistory": ["keep"],
                        "contentHash": "a" * 64,
                    }
                ],
            )

            result = subprocess.run(
                [str(PYTHON), "tools/content_diff.py", str(before), str(after), "--fail-removals-without-tombstone"],
                cwd=REPO_ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("removed=1", result.stdout)
            self.assertIn("tombstone", result.stdout)

    def test_source_manifest_records_source_hashes_and_row_hash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            source_file = tmp_path / "source.json"
            write_json(source_file, {"source": "fixture"})
            rows = [
                {
                    "termId": "term_fixture",
                    "status": "active",
                    "contentHash": "c" * 64,
                }
            ]

            manifest = build_source_manifest(rows, {"fixture": source_file})

            self.assertEqual(manifest["schemaVersion"], "content-source-manifest.v1")
            self.assertEqual(manifest["termCount"], 1)
            self.assertEqual(manifest["activeTermCount"], 1)
            self.assertIn("fixture", manifest["sourceHashes"])
            self.assertEqual(len(manifest["sourceRowsHash"]), 64)

    def test_live_source_snapshot_validates(self) -> None:
        result = subprocess.run(
            [str(PYTHON), "tools/validate_content_source.py"],
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Validated", result.stdout)


if __name__ == "__main__":
    unittest.main()
