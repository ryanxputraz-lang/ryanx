# RYANX Cloudflare Pages

Project login/register dengan Cloudflare Pages Functions, D1, dan Resend.

## Struktur

- `index.html`: Login, Register, dan verifikasi OTP.
- `user.html`: Dashboard pengguna.
- `admin.html`: Dashboard admin.
- `functions/api/`: API backend.
- `functions/_middleware.js`: Proteksi halaman dashboard.

## Pengaturan Cloudflare Pages

1. Upload seluruh isi ZIP ini ke repository GitHub, bukan folder ZIP-nya.
2. Pastikan Build command kosong.
3. Pastikan Build output directory adalah ` / ` atau root project sesuai pengaturan Pages (jangan gunakan folder `public`).
4. Tambahkan binding D1:
   - Variable name: `DB`
   - Database: `ryanx-db`
5. Tambahkan secret:
   - `RESEND_API_KEY`: API key dari Resend.
6. Deploy ulang.

Sender email saat ini diatur sebagai `noreply@ryanx.my.id`. Pastikan domain `ryanx.my.id` sudah verified di Resend.

## SQL D1

Jalankan SQL berikut di D1 Console jika tabel belum dibuat:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
```

Jika tabel lama sudah ada dan kolom `verified_at` belum ada, jalankan perintah ini satu kali:

```sql
ALTER TABLE email_otps ADD COLUMN verified_at TEXT;
```

Jangan jalankan ALTER TABLE jika kolom tersebut sudah ada.

## Membuat admin pertama

Daftar akun biasa terlebih dahulu melalui halaman Register. Setelah itu jalankan di D1 Console:

```sql
UPDATE users SET role = 'admin' WHERE username = 'usernamekamu';
```

Ganti `usernamekamu` dengan username akun yang ingin dijadikan admin.

## API

- `POST /api/send-otp`
- `POST /api/verify-otp`
- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `POST /api/logout`
- `GET /api/test-db`

## Catatan

Session disimpan di D1 dalam bentuk hash token. Cookie memakai HttpOnly, Secure, dan SameSite=Lax. Setiap API yang nantinya mengakses data privat tetap harus memvalidasi session dan role di sisi server.
