import csv
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "tools" / "normalize_glossary_launch.py"


class NormalizeGlossaryLaunchTests(unittest.TestCase):
    def test_normalizes_verified_launch_columns_into_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            content_path = tmp_path / "content.csv"
            out_dir = tmp_path / "published"

            write_csv(
                content_path,
                [
                    ["terms", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                    ["Activation Function", "", "", "", "", "", "", "", "", "", "", "", "", "Activation Function", "Neural Networks", "Components"],
                    ["Activation Function", "", "", "", "", "", "", "", "", "", "", "", "", "Activation Function", "Neural Networks", "Components"],
                    ["A/B Testing for Models", "", "", "", "", "", "", "", "", "", "", "", "", "A/B Testing for Models", "Evaluation Metrics", "Experimentation"],
                    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                ],
            )

            subprocess.run(
                [
                    "python3",
                    str(SCRIPT_PATH),
                    "--content",
                    str(content_path),
                    "--out-dir",
                    str(out_dir),
                ],
                check=True,
            )

            index_payload = json.loads((out_dir / "terms" / "index.json").read_text(encoding="utf-8"))
            taxonomy_payload = json.loads((out_dir / "taxonomy" / "category-tree.json").read_text(encoding="utf-8"))
            search_payload = json.loads((out_dir / "search" / "search-index.json").read_text(encoding="utf-8"))
            report_payload = json.loads((out_dir / "reports" / "normalization-report.json").read_text(encoding="utf-8"))
            duplicate_groups_payload = json.loads((out_dir / "reports" / "duplicate-groups.json").read_text(encoding="utf-8"))

            self.assertEqual(report_payload["termCount"], 2)
            self.assertEqual(report_payload["blankFirstColumnRowsSkipped"], 1)
            self.assertEqual(report_payload["slugCollisionCount"], 1)
            self.assertEqual(report_payload["canonicalizedDuplicateGroups"], 1)
            self.assertEqual(report_payload["duplicateRowsMerged"], 1)

            self.assertEqual(index_payload[0]["slug"], "a-b-testing-for-models")
            self.assertEqual(index_payload[1]["slug"], "activation-function")
            self.assertIn("summary", index_payload[0])
            self.assertNotIn("blocks", index_payload[0])

            categories = {item["name"] for item in taxonomy_payload["categories"]}
            self.assertEqual(categories, {"Evaluation Metrics", "Neural Networks"})

            self.assertEqual(search_payload[1]["category"], "Neural Networks")
            self.assertEqual(duplicate_groups_payload[0]["rowNumbers"], [2, 3])

            term_payload = json.loads(
                (out_dir / "terms" / "by-slug" / "activation-function.json").read_text(encoding="utf-8")
            )
            self.assertEqual(term_payload["taxonomy"]["subCategory"], "Components")
            self.assertEqual(term_payload["source"]["glossarySheet"]["rowNumbers"], [2, 3])


def write_csv(path: Path, rows: list[list[str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerows(rows)


if __name__ == "__main__":
    unittest.main()
