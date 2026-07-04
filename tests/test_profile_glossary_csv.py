import csv
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "tools" / "profile_glossary_csv.py"


class ProfileGlossaryCsvTests(unittest.TestCase):
    def test_profiles_and_exports_duplicates(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            content_path = tmp_path / "content.csv"
            structure_path = tmp_path / "structure.csv"
            out_dir = tmp_path / "out"

            write_csv(
                content_path,
                [
                    ["term", "description"],
                    ["Transformer", "a"],
                    [" transformer ", "b"],
                    ["Attention", "c"],
                    ["", "blank title row"],
                ],
            )
            write_csv(
                structure_path,
                [
                    ["topic"],
                    ["Neural Networks"],
                    ["Neural Networks"],
                    ["MLOps"],
                ],
            )

            subprocess.run(
                [
                    "python3",
                    str(SCRIPT_PATH),
                    "--content",
                    str(content_path),
                    "--structure",
                    str(structure_path),
                    "--out-dir",
                    str(out_dir),
                ],
                check=True,
            )

            content_profile = json.loads((out_dir / "content_profile.json").read_text(encoding="utf-8"))
            structure_profile = json.loads((out_dir / "structure_profile.json").read_text(encoding="utf-8"))

            self.assertEqual(content_profile["row_count"], 4)
            self.assertEqual(content_profile["blank_first_column_rows"], 1)
            self.assertEqual(content_profile["duplicate_normalized_count"], 1)
            self.assertEqual(structure_profile["duplicate_raw_count"], 1)

            duplicates_rows = read_csv(out_dir / "content_duplicates.csv")
            self.assertEqual(duplicates_rows[1], ["transformer", "2"])


def write_csv(path: Path, rows: list[list[str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerows(rows)


def read_csv(path: Path) -> list[list[str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.reader(handle))


if __name__ == "__main__":
    unittest.main()
