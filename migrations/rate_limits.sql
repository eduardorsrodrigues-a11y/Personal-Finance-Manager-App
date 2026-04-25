-- Rate limits table for IP-based auth endpoint throttling.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  ip         TEXT        NOT NULL,
  endpoint   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast window lookups
CREATE INDEX IF NOT EXISTS rate_limits_ip_endpoint_created
  ON rate_limits (ip, endpoint, created_at);

-- Auto-delete rows older than 1 hour to keep the table small.
-- Supabase doesn't have TTL natively, so we use a pg_cron job.
-- If pg_cron is not enabled, rows accumulate but queries still work
-- (the window filter keeps results correct).
SELECT cron.schedule(
  'purge-rate-limits',
  '0 * * * *',  -- every hour
  $$DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour'$$
);

-- Disable RLS (this table contains only IPs, no user data)
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
