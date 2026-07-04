import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from tools.add_emerging_terms import load_terms
from tools.build_published_content import normalize_key


REPO_ROOT = Path(__file__).resolve().parents[1]
EMERGING_TERMS_PATH = REPO_ROOT / "content" / "source" / "emerging-terms-2024-2026.json"
REGISTRY_PATH = REPO_ROOT / "data" / "taxonomy-registry.json"
PYTHON = REPO_ROOT / ".venv" / "bin" / "python3"


class EmergingTermsSourceTests(unittest.TestCase):
    def test_emerging_terms_are_diffable_and_classified(self) -> None:
        payload = json.loads(EMERGING_TERMS_PATH.read_text(encoding="utf-8"))
        terms = payload["terms"]

        self.assertEqual(payload["kind"], "emerging-terms")
        self.assertEqual(payload["termCount"], len(terms))
        self.assertGreaterEqual(len(terms), 100)
        self.assertEqual(len({row["title"] for row in terms}), len(terms))
        self.assertFalse([row for row in terms if not row["taxonomy"]["category"]])

    def test_emerging_terms_have_registry_entries(self) -> None:
        terms = load_terms(EMERGING_TERMS_PATH)
        registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))["entries"]
        missing = [row["title"] for row in terms if normalize_key(row["title"]) not in registry]
        unclassified = [
            row["title"]
            for row in terms
            if not registry.get(normalize_key(row["title"]), {}).get("category")
        ]

        self.assertEqual(missing, [])
        self.assertEqual(unclassified, [])

    def test_add_emerging_terms_is_idempotent_when_terms_exist(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            workbook_path = tmp_path / "glossary.xlsx"
            terms_path = tmp_path / "terms.json"

            workbook = Workbook()
            sheet = workbook.active
            sheet.title = "main"
            sheet["A1"] = "terms"
            sheet["A2"] = "Mamba"
            workbook.save(workbook_path)

            terms_path.write_text(
                json.dumps(
                    {
                        "kind": "emerging-terms",
                        "terms": [
                            {
                                "title": "Mamba",
                                "taxonomy": {"category": "Model Architecture", "subCategory": "Large-Scale Models"},
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    str(PYTHON),
                    "tools/add_emerging_terms.py",
                    "--glossary-workbook",
                    str(workbook_path),
                    "--terms-source",
                    str(terms_path),
                ],
                cwd=REPO_ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("No workbook changes needed", result.stdout)


if __name__ == "__main__":
    unittest.main()
