// functions/api/verify-otp.js

export async function onRequestPost({ request, env }) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return Response.json({ error: 'Email dan OTP wajib diisi' }, { status: 400 });
    }

    // Ambil data OTP terbaru untuk email ini
    const record = await env.DB.prepare(
      'SELECT * FROM otp_codes WHERE email = ? ORDER BY id DESC LIMIT 1'
    ).bind(email).first();

    if (!record) {
      return Response.json({ error: 'Kode OTP tidak ditemukan. Silakan kirim ulang.' }, { status: 404 });
    }

    // Cek kedaluwarsa
    if (new Date(record.expires_at) < new Date()) {
      await env.DB.prepare('DELETE FROM otp_codes WHERE email = ?').bind(email).run();
      return Response.json({ error: 'Kode OTP sudah kedaluwarsa. Kirim ulang.' }, { status: 410 });
    }

    // Cek kecocokan OTP
    if (record.otp_code !== otp) {
      return Response.json({ error: 'Kode OTP salah' }, { status: 401 });
    }

    // ✅ Simpan user ke tabel users
    try {
      await env.DB.prepare(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
      ).bind(record.username, record.email, record.password, 'user').run();
    } catch (e) {
      // Race condition: mungkin sudah terdaftar duluan
      return Response.json({ error: 'Username atau email sudah dipakai' }, { status: 409 });
    }

    // Bersihkan OTP
    await env.DB.prepare('DELETE FROM otp_codes WHERE email = ?').bind(email).run();

    return Response.json({ ok: true, message: 'Akun berhasil dibuat' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}