// Mengambil elemen tempat tahun akan ditampilkan
const yearElement = document.querySelector("#current-year");

// Memasukkan tahun saat ini ke dalam elemen footer
yearElement.textContent = new Date().getFullYear();