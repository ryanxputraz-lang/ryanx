// functions/api/register.js
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { username, email, password, role } = await request.json();
    if (!username || !email || !password) {
      return Response.json({ error: 'Semua field wajib' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password min 6 karakter' }, { status: 400 });
    }
    const safeRole = (role === 'admin' || role === 'user') ? role : 'user';
    const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (exists) {
      return Response.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }
    await env.DB.prepare(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
    ).bind(username, email, password, safeRole).run();
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}