export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const { username, email, password } = await request.json();
  const u = (username || '').trim();
  const e = (email || '').trim().toLowerCase();
  const p = (password || '').trim();

  if (!u || !e || !p) return Response.json({ error: 'Lengkapi semua' }, { status: 400 });

  const exists = await db.prepare("SELECT id FROM users WHERE LOWER(username)=? OR LOWER(email)=?").bind(u.toLowerCase(), e).first();
  if (exists) return Response.json({ error: 'Username atau email sudah dipakai' }, { status: 400 });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 menit

  await db.prepare("INSERT INTO users (username, email, password, otp, otp_expires, verified) VALUES (?,?,?,?,?,0)").bind(u, e, p, otp, expires).run();

  // Kirim email OTP beneran via Resend
  try {
    const from = env.MAIL_FROM || 'RyanX <onboarding@resend.dev>';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from,
        to: e,
        subject: `OTP RyanX: ${otp}`,
        html: `<div style="font-family:sans-serif;padding:24px;background:#07080b;color:#fff"><h2 style="color:#facc15">RYANX.MY.ID</h2><p>Halo ${u}, kode OTP kamu:</p><div style="font-size:32px;font-weight:900;letter-spacing:8px;background:#fff;color:#000;padding:12px;text-align:center;border-radius:12px">${otp}</div><p style="font-size:11px;color:#999;margin-top:12px">Berlaku 10 menit. Jangan share ke siapapun.</p></div>`
      })
    });
  } catch (err) {
    console.log('Email error', err);
  }

  return Response.json({ success: true });
}