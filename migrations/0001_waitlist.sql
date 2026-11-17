-- Waitlist with double opt-in. One row per address, ever.
CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  ref TEXT NOT NULL DEFAULT 'direct',
  marketing INTEGER NOT NULL DEFAULT 0 CHECK (marketing IN (0, 1)),
  policy_version TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  -- Only hashes are stored: a database leak cannot be replayed into a confirm link.
  token_hash TEXT,
  token_expires_at INTEGER NOT NULL DEFAULT 0,
  manage_hash TEXT,
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  -- sha256(ip + salt). The raw address is never written.
  ip_hash TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique ON waitlist (email);
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_token_unique ON waitlist (token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_manage_unique ON waitlist (manage_hash);
CREATE INDEX IF NOT EXISTS waitlist_created_idx ON waitlist (created_at);

-- Fixed hourly windows, one row per (address hash, hour).
CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);
