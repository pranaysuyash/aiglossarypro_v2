import sqlite3
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = REPO_ROOT / "infra" / "d1" / "schema.sql"
MIGRATIONS_DIR = REPO_ROOT / "infra" / "d1" / "migrations"


class D1SchemaSqlTests(unittest.TestCase):
    def test_schema_applies_cleanly_to_sqlite(self) -> None:
        connection = sqlite3.connect(":memory:")
        try:
            schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
            connection.executescript(schema_sql)

            expected_tables = {
                "users",
                "entitlements",
                "pending_entitlements",
                "billing_events",
                "bookmarks",
                "notes",
                "annotations",
                "collections",
                "collection_terms",
                "share_links",
                "export_jobs",
                "analytics_events",
            }

            cursor = connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
            actual_tables = {row[0] for row in cursor.fetchall()}

            for table_name in expected_tables:
                self.assertIn(table_name, actual_tables)
        finally:
            connection.close()

    def test_entitlements_use_provider_neutral_billing_columns(self) -> None:
        connection = sqlite3.connect(":memory:")
        try:
            schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
            connection.executescript(schema_sql)

            cursor = connection.execute("PRAGMA table_info(entitlements)")
            columns = {row[1] for row in cursor.fetchall()}

            self.assertTrue(
                {
                    "billing_provider",
                    "provider_customer_id",
                    "provider_subscription_id",
                    "provider_checkout_session_id",
                    "provider_product_id",
                    "provider_price_id",
                }.issubset(columns)
            )
            self.assertFalse(
                {
                    "stripe_customer_id",
                    "stripe_subscription_id",
                    "stripe_price_id",
                }.intersection(columns)
            )
        finally:
            connection.close()

    def test_latest_migration_matches_schema(self) -> None:
        latest_migration = sorted(MIGRATIONS_DIR.glob("*.sql"))[-1]
        self.assertEqual(
            SCHEMA_PATH.read_text(encoding="utf-8").strip(),
            latest_migration.read_text(encoding="utf-8").strip(),
        )


if __name__ == "__main__":
    unittest.main()
