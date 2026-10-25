-- RyanX D1 Schema - ryanx-db
-- Jalankan: npx wrangler d1 execute ryanx-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=ryanx',
  rxc_balance INTEGER DEFAULT 100,
  username_color TEXT DEFAULT '#ffffff',
  border_style TEXT DEFAULT 'none',
  card_bg TEXT DEFAULT 'default',
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  resend_available_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coin_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount INTEGER,
  source TEXT,
  meta TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  content TEXT,
  cost INTEGER DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  user_id TEXT,
  content TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inbox (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index biar cepat
CREATE INDEX IF NOT EXISTS idx_users_rxc ON users(rxc_balance DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON coin_ledger(user_id);