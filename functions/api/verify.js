export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const { email, otp } = await request.json();
  const e = (email || '').trim().toLowerCase();

  const user = await db.prepare("SELECT * FROM users WHERE LOWER(email)=?").bind(e).first();
  if (!user) return Response.json({ error: 'Email tidak ditemukan' }, { status: 404 });
  if (user.verified) return Response.json({ success: true });

  if (String(user.otp) !== String(otp).trim()) {
    return Response.json({ error: 'OTP salah' }, { status: 400 });
  }
  if (Date.now() > Number(user.otp_expires)) {
    return Response.json({ error: 'OTP expired, daftar ulang' }, { status: 400 });
  }

  // Baru hapus OTP setelah verified = 1 (ini fix OTP null kemarin)
  await db.prepare("UPDATE users SET verified=1, otp=NULL, otp_expires=NULL WHERE id=?").bind(user.id).run();
  return Response.json({ success: true });
}