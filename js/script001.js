// ===== SCRIPT SEDERHANA =====
// Tujuan: mengisi tahun otomatis di footer

// Jalankan setelah seluruh DOM selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  // Ambil elemen dengan id="year"
  const yearEl = document.getElementById("year");

  // Jika elemennya ada, isi dengan tahun sekarang
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});