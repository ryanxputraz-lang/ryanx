-- schema.sql - jalankan di D1 ryanx-db
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin','user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Buat admin pertama
INSERT OR IGNORE INTO users (username, email, password, role) VALUES ('ryan admin', 'admin@ryanx.my.id', 'admin123', 'admin');