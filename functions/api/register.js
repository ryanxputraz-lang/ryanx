export async function onRequestPost({ request, env }) {
  try {
    const db = env['ryanx-db'] || env.ryanx_db || env.DB || env['ryanx_db'] || env.RYANX_DB;
    if(!db) return Response.json({ error: 'DB binding tidak ketemu. Cek di Pages > Settings > Functions > D1 bindings' }, { status: 500 });
    
    const { username, email, password } = await request.json();
    const u = (username || '').trim();
    const e = (email || '').trim().toLowerCase();
    const p = (password || '').trim();
    if (!u || !e || !p) return Response.json({ error: 'Lengkapi semua' }, { status: 400 });

    const exists = await db.prepare("SELECT id FROM users WHERE LOWER(username)=? OR LOWER(email)=?").bind(u.toLowerCase(), e).first();
    if (exists) return Response.json({ error: 'Username/email sudah dipakai' }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    await db.prepare("INSERT INTO users (username, email, password, otp, otp_expires, verified) VALUES (?,?,?,?,?,0)").bind(u, e, p, otp, expires).run();

    // Coba kirim email, kalau gagal jangan bikin error
    let emailSent = false;
    try {
      if(env.RESEND_API_KEY){
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: env.MAIL_FROM || 'RyanX <onboarding@resend.dev>',
            to: e,
            subject: `OTP RyanX: ${otp}`,
            html: `<div style="font-family:sans-serif;padding:24px"><h2>Kode OTP: ${otp}</h2><p>Berlaku 10 menit</p></div>`
          })
        });
        emailSent = true;
      }
    } catch(err){ console.log('email fail', err); }

    // Kalau email belum di set, kasih OTP nya langsung biar bisa testing
    return Response.json({ success: true, debug_otp: emailSent ? null : otp });

  } catch(err) {
    return Response.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}