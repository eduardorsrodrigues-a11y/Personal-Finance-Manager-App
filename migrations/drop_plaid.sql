-- Drops Plaid-related tables/columns now that bank account integration has been removed.
-- Run this manually in the Supabase SQL editor against your live project — it is NOT applied automatically.
-- Irreversible: back up `plaid_connections` / `pending_transactions` first if you want to keep the data
-- (e.g. encrypted access tokens, pending-review history).

DROP TABLE IF EXISTS pending_transactions;
DROP TABLE IF EXISTS plaid_connections;

DROP INDEX IF EXISTS transactions_plaid_txn_unique;
ALTER TABLE transactions DROP COLUMN IF EXISTS plaid_txn_id;
