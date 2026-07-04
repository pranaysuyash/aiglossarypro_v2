import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PATH_INDEX_PATH = REPO_ROOT / "public" / "content" / "published" / "paths" / "index.json"
PATH_DETAIL_DIR = REPO_ROOT / "public" / "content" / "published" / "paths" / "by-slug"


class PublishedPathsJsonTests(unittest.TestCase):
    def test_path_index_is_a_non_empty_list(self) -> None:
        payload = json.loads(PATH_INDEX_PATH.read_text(encoding="utf-8"))

        self.assertIsInstance(payload, list)
        self.assertGreater(len(payload), 0)

        for path in payload:
            self.assertIn("slug", path)
            self.assertIn("title", path)
            self.assertIn("description", path)
            self.assertIn("category", path)
            self.assertIn("subCategory", path)
            self.assertIn("termCount", path)
            self.assertIn("featuredTermSlugs", path)

    def test_every_path_summary_has_a_detail_artifact(self) -> None:
        payload = json.loads(PATH_INDEX_PATH.read_text(encoding="utf-8"))

        for path in payload:
            detail_path = PATH_DETAIL_DIR / f"{path['slug']}.json"
            self.assertTrue(detail_path.exists(), detail_path.as_posix())

            detail_payload = json.loads(detail_path.read_text(encoding="utf-8"))
            self.assertEqual(detail_payload["slug"], path["slug"])
            self.assertIn("steps", detail_payload)
            self.assertGreater(len(detail_payload["steps"]), 0)


if __name__ == "__main__":
    unittest.main()
