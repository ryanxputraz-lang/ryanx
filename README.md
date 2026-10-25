
# ryanx - Minimalist Sosmed

Stack: Cloudflare Pages + Functions + D1 (ryanx-db) + Vanilla JS + TailwindCDN

## Struktur
- /index.html -> SPA: login, register, feed, anggota, profil, admin
- /functions/api/... -> Backend API pakai D1
- /schema.sql -> Schema D1

## Fitur yang kamu minta:
1. Login / Register (hash password SHA-256 + salt sederhana, JWT via cookie-less token di localStorage)
2. Dashboard User: buat post sharing, like, feed global kronologis
3. Daftar Orang / Anggota: semua user yang terdaftar terlihat
4. Pengaturan Akun: edit profil, bio, avatar
5. Admin Panel: kelola user (hapus, jadikan admin), kelola post, lihat statistik D1
6. Tanpa sistem pertemanan - semua terhubung

## Cara Deploy agar jalan di ryanx-id.pages.dev
1. Push semua file ini ke https://github.com/ryanxputraz-lang/ryanx (root repo)
2. Di Cloudflare Dashboard > Pages > ryanx-id > Settings > Functions > D1 Binding:
   - Variable name: DB
   - D1 Database: ryanx-db
3. Jalankan schema.sql di D1:
   - Dashboard > D1 > ryanx-db > Console > paste isi schema.sql
4. Settings > Environment variables: 
   - JWT_SECRET = isi random string panjang misal ryanx-super-secret-2026
5. Deploy akan otomatis. Cek ryanx-id.pages.dev

Custom domain ryanx.my.id:
- Pages > Custom domains > Add ryanx.my.id & www.ryanx.my.id

Akun Admin pertama:
- Register dulu dengan username: admin
- Lalu di D1 Console jalankan: UPDATE users SET role='admin' WHERE username='admin';
- Login ulang, menu Admin akan muncul

Keamanan:
- Password di-hash pakai Web Crypto SHA-256 + salt di edge (cukup untuk minimalis, kalau mau lebih kuat ganti ke bcrypt di Worker)
- Token JWT HMAC sederhana valid 7 hari
- Semua route admin cek role

Mau upgrade nanti: tambah upload image ke R2, tambah komentar nested.
