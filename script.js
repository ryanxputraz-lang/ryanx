/* =========================================================
   TEMPLATE MOBILE - ryanx.my.id
   Semua interaksi sederhana ada di sini.
   ========================================================= */

// ---------- 1. Toggle Menu Navigasi ----------
// Ambil elemen tombol & menu berdasarkan ID di HTML
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

// Saat tombol hamburger diklik, tampilkan/sembunyikan menu
menuBtn.addEventListener("click", () => {
 navMenu.classList.toggle("active");
});

// ---------- 2. Tutup Menu Setelah Klik Link ----------
// Setelah user pilih menu, menu otomatis tertutup (UX mobile)
navMenu.querySelectorAll("a").forEach((link) => {
 link.addEventListener("click", () => {
  navMenu.classList.remove("active");
 });
});

// ---------- 3. Interaksi Tombol CTA di Hero ----------
const ctaBtn = document.getElementById("ctaBtn");
const ctaMessage = document.getElementById("ctaMessage");

// GANTI: teks pesan yang muncul setelah tombol diklik
ctaBtn.addEventListener("click", () => {
 ctaMessage.textContent = "Terima kasih sudah mengklik! 🎉";
});

// ---------- 4. Tahun Otomatis di Footer ----------
// Biar tidak perlu update manual tiap tahun
document.getElementById("year").textContent = new Date().getFullYear();
