-- Full schema for MyMoneyMate.
-- Run this in a fresh Supabase project (e.g. dev/staging) to initialise all tables.
-- Safe to re-run: all statements use IF NOT EXISTS.

-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub    TEXT UNIQUE,
  email         TEXT UNIQUE,
  name          TEXT,
  birthday      DATE,
  password_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User settings ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_currency TEXT NOT NULL DEFAULT 'EUR',
  risk_profile     TEXT,
  budgets          JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Transactions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount           NUMERIC(12, 2) NOT NULL,
  description      TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  category         TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_date
  ON transactions (user_id, transaction_date DESC);

-- ── Rate limits ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  ip         TEXT NOT NULL,
  endpoint   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limits_ip_endpoint_created
  ON rate_limits (ip, endpoint, created_at);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- We use the service role key server-side so RLS is disabled on all tables.
-- Never expose the service role key to the client.

ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits   DISABLE ROW LEVEL SECURITY;
