
# RyanX - ryanx.my.id

Stack: Cloudflare Pages (pages.dev) + D1 + Functions

## Deploy
1. Paste schema.txt ke D1 Console (Cloudflare Dashboard > D1 > Console)
2. Buat user admin manual: UPDATE users SET role='admin' WHERE username='ryanxputraz'
3. Push folder ini ke github.com/ryanxputraz-lang/ryanx
   - Build output dir: public
   - Functions dir: functions
   - Bind D1 as DB

## Fitur
- Auth JWT simple, new user 1000 XP (configurable)
- Blackjack bet min 50
- Snake reward per tikus + cooldown anti spam (server side last_snake_game)
- Lobby auto room 1/2/3, offline status, afk tetap terlihat
- Forum biaya 2000 XP + gambar/link
- Mall 3 kategori headgear/outfit/other + inventory
- Admin panel croud user, config anti inflasi, shop, announcement
- Transfer XP pajak 10% -> admin/tax.html
- Trading CFD candle 1m/5m
- Dadu besar/kecil/angka/ganjil/genap

Footer: RyanX with Meta AI
