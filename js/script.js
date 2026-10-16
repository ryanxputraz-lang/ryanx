// Mengambil elemen tempat tahun akan ditampilkan
const yearElement = document.querySelector("#current-year");

// Memasukkan tahun saat ini ke dalam elemen footer
yearElement.textContent = new Date().getFullYear();

//Time WIB
function updateEyebrowWIB() {
  const clockEl = document.getElementById('wib-clock');
  const dateEl = document.getElementById('wib-date');
  if (!clockEl || !dateEl) return;

  const now = new Date();

  const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  clockEl.textContent = `${timeFormatter.format(now)} WIB`;
  dateEl.textContent = dateFormatter.format(now);
}

document.addEventListener('DOMContentLoaded', () => {
  updateEyebrowWIB();
  setInterval(updateEyebrowWIB, 1000);
});