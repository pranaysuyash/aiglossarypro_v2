-- AIGlossary v2 D1 baseline schema
-- Date: 2026-06-29

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  auth_provider TEXT NOT NULL,
  auth_subject TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_identity
  ON users (auth_provider, auth_subject);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_family TEXT NOT NULL,
  billing_mode TEXT NOT NULL,
  status TEXT NOT NULL,
  billing_provider TEXT NOT NULL DEFAULT 'dodo_payments',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  provider_checkout_session_id TEXT,
  provider_product_id TEXT,
  provider_price_id TEXT,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user
  ON entitlements (user_id);

CREATE INDEX IF NOT EXISTS idx_entitlements_status
  ON entitlements (status);

CREATE TABLE IF NOT EXISTS pending_entitlements (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  billing_provider TEXT NOT NULL,
  plan_family TEXT NOT NULL,
  billing_mode TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  provider_payment_id TEXT,
  provider_product_id TEXT,
  provider_event_id TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  claimed_by_user_id TEXT,
  claimed_at TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_entitlements_event
  ON pending_entitlements (provider_event_id);

CREATE INDEX IF NOT EXISTS idx_pending_entitlements_email
  ON pending_entitlements (customer_email);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  billing_provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_provider_id
  ON billing_events (billing_provider, id);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  term_slug TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_term
  ON bookmarks (user_id, term_slug);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  term_slug TEXT NOT NULL,
  title TEXT,
  body_markdown TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_user
  ON notes (user_id);

CREATE INDEX IF NOT EXISTS idx_notes_term
  ON notes (term_slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_user_term
  ON notes (user_id, term_slug);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  term_slug TEXT NOT NULL,
  block_id TEXT NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  selected_text TEXT,
  note_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_annotations_user_term
  ON annotations (user_id, term_slug);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collections_user
  ON collections (user_id);

CREATE TABLE IF NOT EXISTS collection_terms (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  term_slug TEXT NOT NULL,
  position INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_terms_unique
  ON collection_terms (collection_id, term_slug);

CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  token TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token
  ON share_links (token);

CREATE TABLE IF NOT EXISTS export_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  export_type TEXT NOT NULL,
  status TEXT NOT NULL,
  object_key TEXT,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_user
  ON export_jobs (user_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  event_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type
  ON analytics_events (event_type);
