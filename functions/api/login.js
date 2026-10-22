export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const { username, password } = await request.json();
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();

  if (!u || !p) return Response.json({ error: 'Isi username & password' }, { status: 400 });

  const user = await db.prepare("SELECT id, username, email, password, verified FROM users WHERE LOWER(username)=?").bind(u).first();
  if (!user) return Response.json({ error: 'Username tidak ditemukan' }, { status: 401 });
  if (String(user.password).trim() !== p) return Response.json({ error: 'Password salah' }, { status: 401 });
  if (!user.verified) return Response.json({ error: 'Akun belum verifikasi OTP' }, { status: 403 });

  // Bikin token real live
  const token = btoa(`${user.id}:${Date.now()}:${crypto.randomUUID()}`);
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 hari
  await db.prepare("INSERT INTO sessions (user_id, token, expires) VALUES (?,?,?)").bind(user.id, token, exp).run();

  return Response.json({ success: true, token: token, user: { id: user.id, username: user.username, email: user.email } });
}