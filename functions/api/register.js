// functions/api/register.js

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  try {
    const { username, email, password } = await request.json();

    // Validasi input
    if (!username || !email || !password) {
      return Response.json({ error: 'Semua kolom wajib diisi' }, { status: 400 });
    }
    if (username.length < 3) {
      return Response.json({ error: 'Username minimal 3 karakter' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    // Cek apakah username/email sudah terdaftar
    const existing = await env.DB.prepare(
      'SELECT username, email FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first();

    if (existing) {
      if (existing.username === username) {
        return Response.json({ error: 'Username sudah dipakai' }, { status: 409 });
      }
      if (existing.email === email) {
        return Response.json({ error: 'Email sudah terdaftar' }, { status: 409 });
      }
    }

    // Generate OTP 6 digit
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const passwordHash = await sha256(password);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

    // Hapus OTP lama untuk email ini, lalu simpan OTP baru
    await env.DB.prepare('DELETE FROM otp_codes WHERE email = ?').bind(email).run();
    await env.DB.prepare(
      'INSERT INTO otp_codes (email, username, password, otp_code, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, username, passwordHash, otp, expiresAt).run();

    // Kirim email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Ganti dengan domainmu jika sudah setup
        to: email,
        subject: 'Kode Verifikasi Akun Anda',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px">
            <h2 style="color:#667eea">Verifikasi Email</h2>
            <p>Halo <b>${username}</b>,</p>
            <p>Terima kasih telah mendaftar. Gunakan kode OTP berikut untuk menyelesaikan pendaftaran:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;
                        padding:20px;background:#f5f7ff;border-radius:8px;color:#667eea;margin:20px 0">
              ${otp}
            </div>
            <p style="font-size:13px;color:#888">Kode berlaku selama <b>10 menit</b>.</p>
            <p style="font-size:13px;color:#888">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
          </div>
        `
      })
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
      return Response.json({ error: 'Gagal mengirim email. Coba lagi nanti.' }, { status: 500 });
    }

    return Response.json({ ok: true, message: 'Kode OTP telah dikirim ke email' });
  } catch (err) {
    console.error('Register error:', err);
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}