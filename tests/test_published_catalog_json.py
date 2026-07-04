import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = REPO_ROOT / "public" / "content" / "published" / "terms" / "index.json"
MANIFEST_PATH = REPO_ROOT / "public" / "content" / "published" / "terms" / "manifest.json"
TERM_SHARD_DIR = REPO_ROOT / "public" / "content" / "published" / "terms" / "shards"


class PublishedCatalogJsonTests(unittest.TestCase):
    def test_catalog_json_is_a_non_empty_term_list(self) -> None:
        payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

        self.assertIsInstance(payload, list)
        self.assertGreater(len(payload), 0)

        for term in payload:
            self.assertIn("id", term)
            self.assertIn("slug", term)
            self.assertIn("title", term)
            self.assertIn("summary", term)
            self.assertIn("taxonomy", term)
            self.assertIn("metadata", term)

    def test_manifest_and_shards_cover_every_catalog_slug(self) -> None:
        payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

        self.assertEqual(manifest["totalTerms"], len(payload))
        self.assertGreater(manifest["shardCount"], 0)

        shard_terms_by_id: dict[str, dict[str, dict]] = {}
        for term in payload:
            self.assertIn("artifact", term)
            shard_id = term["artifact"]["shardId"]
            shard_path = TERM_SHARD_DIR / f"{shard_id}.json"
            self.assertTrue(shard_path.exists(), shard_path.as_posix())

            if shard_id not in shard_terms_by_id:
                shard_payload = json.loads(shard_path.read_text(encoding="utf-8"))
                shard_terms_by_id[shard_id] = {item["slug"]: item for item in shard_payload["terms"]}
            detail_payload = shard_terms_by_id[shard_id].get(term["slug"])
            self.assertIsNotNone(detail_payload, term["slug"])
            self.assertEqual(detail_payload["slug"], term["slug"])
            self.assertIn("blocks", detail_payload)
            self.assertGreater(len(detail_payload["blocks"]), 0)

    def test_catalog_slugs_are_unique(self) -> None:
        payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        slugs = [term["slug"] for term in payload]

        self.assertEqual(len(slugs), len(set(slugs)))


if __name__ == "__main__":
    unittest.main()
