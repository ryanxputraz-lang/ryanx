
# RyanX Blackjack - Fun Money Edition
Game blackjack untuk hiburan, chip TIDAK bernilai uang asli dan TIDAK bisa ditukar rupiah.

## Deploy ke ryanx-id.pages.dev
1. Push semua file ini ke github.com/ryanxputraz-lang/ryanx
2. Di Cloudflare Pages > Settings > Functions > D1 Bindings: Bind `DB` ke `ryanx-db`
3. Buat tabel D1:
```sql
CREATE TABLE users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 chips INTEGER DEFAULT 1000,
 is_admin INTEGER DEFAULT 0,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- buat admin pertama: ryanxputraz / password admin123 (ganti segera)
INSERT INTO users (username, password_hash, chips, is_admin) VALUES ('ryanxputraz', 'admin123_hash', 10000, 1);
```
Untuk hash sederhana, project ini pakai SHA256 di Worker, tapi untuk prod sebaiknya pakai bcrypt. Sudah ada migrasi di /migrations.

4. Deploy - domain ryanx.my.id otomatis aktif.

## Fitur
- / = login/register
- /game.html = blackjack vs dealer
- /admin.html = admin panel atur chip (hanya user is_admin=1)
- /api/* = Cloudflare Functions + D1

Catatan: Topup di sini = klaim harian gratis 500 chip, bukan bayar.
