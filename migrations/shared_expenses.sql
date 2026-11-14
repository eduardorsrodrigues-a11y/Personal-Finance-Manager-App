-- Shared Expenses: groups, members, expenses and per-member splits.
-- Each linked member's share of an expense is mirrored into `transactions`
-- (via transactions.shared_expense_id) so it shows up in their history/budgets.
-- Safe to re-run.

-- ── Groups ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Members ───────────────────────────────────────────────────────────────────
-- A member may or may not have a MyMoneyMate account. When `email` matches a
-- user (now or after they sign up), `user_id` gets linked automatically.

CREATE TABLE IF NOT EXISTS expense_group_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  email         TEXT,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS expense_group_members_group_user
  ON expense_group_members (group_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS expense_group_members_group_email
  ON expense_group_members (group_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS expense_group_members_user
  ON expense_group_members (user_id);
CREATE INDEX IF NOT EXISTS expense_group_members_pending_email
  ON expense_group_members (lower(email)) WHERE user_id IS NULL;

-- ── Expenses ──────────────────────────────────────────────────────────────────
-- kind = 'expense'    → a purchase paid by `paid_by`, split between members
-- kind = 'settlement' → `paid_by` paid back the single member in splits

CREATE TABLE IF NOT EXISTS shared_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense', 'settlement')),
  description   TEXT NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category      TEXT NOT NULL,
  expense_date  DATE NOT NULL,
  paid_by       UUID NOT NULL REFERENCES expense_group_members(id),
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shared_expenses_group_date
  ON shared_expenses (group_id, expense_date DESC);

CREATE TABLE IF NOT EXISTS shared_expense_splits (
  expense_id  UUID NOT NULL REFERENCES shared_expenses(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES expense_group_members(id),
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (expense_id, member_id)
);

CREATE INDEX IF NOT EXISTS shared_expense_splits_member
  ON shared_expense_splits (member_id);

-- ── Link personal transactions to the shared expense they came from ──────────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS shared_expense_id UUID REFERENCES shared_expenses(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_shared_expense_user
  ON transactions (shared_expense_id, user_id) WHERE shared_expense_id IS NOT NULL;

-- ── RLS (service role only, same as other tables) ────────────────────────────

ALTER TABLE expense_groups        DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expenses       DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expense_splits DISABLE ROW LEVEL SECURITY;
