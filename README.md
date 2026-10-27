# ⚡ Builder Pro — ryanx.my.id

HTML/CSS/JS Builder full flexible. Single-page, no build step, mobile-first.

## 🚀 Deploy ke Cloudflare Pages

### Cara 1 — Auto deploy dari GitHub (rekomendasi)
1. Push repo ini ke GitHub.
2. Buka [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pilih repo `ryanx-builder`.
4. Build settings:
   - **Framework preset**: None
   - **Build command**: *(kosongkan)*
   - **Build output directory**: `/`
5. **Save and Deploy**.
6. Setelah live, buka **Custom domains** → **Set up a custom domain** → masukkan `ryanx.my.id`.
7. Pastikan DNS `ryanx.my.id` sudah pakai nameserver Cloudflare. CNAME akan dibuat otomatis.

### Cara 2 — Direct Upload
1. Drag folder `ryanx-builder/` ke Cloudflare Pages → Upload assets.
2. Set custom domain sama seperti di atas.

## 📁 Struktur
