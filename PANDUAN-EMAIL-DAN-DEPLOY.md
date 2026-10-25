# RyanX ULTIMATE - Panduan Lengkap 1 ZIP

## Isi ZIP ini
- public/index.html (Login/Register No-Zoom + OTP timer)
- public/app.html (Beranda 8 menu + 5 game full)
- public/snake-full.js (Ular RXC beneran playable)
- functions/api/auth.js (OTP + hash aman + EMAIL BENERAN)
- functions/api/user.js (forum, shop, akun, kirim koin)
- functions/api/games.js (BlekJek, Roda Gembira, Bandar Q, Ular, Trading)
- functions/api/admin.js (Dashboard anti-inflasi)
- schema.sql (D1)
- wrangler.toml

---

## CARA SETTING EMAIL BENERAN (WAJIB BACA)

Kamu punya 2 pilihan, pilih SALAH SATU:

### OPSI A: RESEND (PALING GAMPANG, REKOMENDASI UNTUK PEMULA)

1. Daftar di https://resend.com (gratis 100 email/hari, 3000/bulan)
2. Masuk Dashboard > Domains > Add Domain > masukkan `ryanx.my.id`
3. Resend akan kasih 3 DNS TXT record. Buka Cloudflare Dashboard > Domain > DNS > Tambah record itu.
4. Tunggu verified (5-30 menit)
5. Dashboard Resend > API Keys > Create API Key > copy `re_xxxx`
6. Buka Cloudflare Dashboard > Pages > ryanx-id > Settings > Environment Variables > Add variable
   - Name: `RESEND_API_KEY`
   - Value: `re_xxxx` kamu
   - Save + Redeploy
7. Selesai! Sekarang OTP akan masuk email beneran. Kode di auth.js sudah otomatis pakai Resend jika variabel ada.

Template email sudah kece: background gelap, kode besar 32px, ada nama RyanX.

### OPSI B: MAILCHANNELS (GRATIS 100% SELAMANYA, TANPA API KEY)

- Syarat: Domain ryanx.my.id harus sudah di Cloudflare (kamu sudah)
- Tidak perlu API key, cukup pastikan di Cloudflare > Email > Email Routing > Disable (biar tidak bentrok)
- Kode di auth.js sudah otomatis fallback ke MailChannels jika RESEND_API_KEY tidak ada
- Kelemahan: Kadang masuk spam jika SPF belum benar. Resend lebih aman.

### Cara Tes Email
1. Deploy dulu
2. Buka ryanx.my.id > Daftar > Isi email > Kirim OTP
3. Cek inbox (dan spam)
4. Jika masih DEV CODE muncul, berarti RESEND_API_KEY belum ke-set. Set di dashboard lalu Redeploy (Retry deployment).

---

## CARA DEPLOY LENGKAP

1. Extract zip ini
2. Buka wrangler.toml > Ganti `database_id` dengan ID D1 kamu
   Cara dapat ID: Cloudflare Dashboard > D1 > ryanx-db > Copy ID
3. Install wrangler: `npm i -g wrangler`
4. Login: `npx wrangler login`
5. Buat tabel: `npx wrangler d1 execute ryanx-db --file=./schema.sql --remote`
6. Push ke GitHub:
   ```
   git init
   git remote add origin https://github.com/ryanxputraz-lang/ryanx.git
   git add .
   git commit -m "RyanX Ultimate"
   git push -f origin main
   ```
7. Cloudflare Pages akan auto deploy ke ryanx-id.pages.dev
8. Custom domain ryanx.my.id sudah connect, auto live
9. Jadikan kamu admin:
   `npx wrangler d1 execute ryanx-db --command="UPDATE users SET is_admin=1 WHERE username='ryanxputraz'" --remote`

---

## PENJELASAN KEAMANAN (KENAPA TIDAK PLAIN TEXT)

- Password di-hash PBKDF2 100.000 iterasi, salt random 16 byte. Ini standar industri.
- Jika DB bocor, hacker tidak dapat password asli.
- Kamu tetap bisa login normal.

## ANTI-INFLASI RXC

- Semua game punya house edge 52-55% untuk bandar
- Forum post cost 10 RXC = coin sink
- Shop hias 500-2500 RXC = coin sink utama
- Admin dashboard bisa lihat `SUM(rxc_balance)` total beredar. Jika > 1jt, naikkan harga shop.

## KEMBANGKAN LAGI

- Tambah R2 untuk upload avatar (bukan URL)
- Tambah Cron untuk reset leaderboard mingguan
- Tambah iklan: di app.html ada slot siap untuk AdSense

Butuh bantuan? Chat lagi!