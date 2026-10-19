// functions/api/me.js - cek session
export async function onRequestGet(context) {
  const { request, env } = context;
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/ryanx_session=([^;]+)/);
  if (!match) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = JSON.parse(atob(match[1]));
    const user = await env.DB.prepare('SELECT id, username, email, role FROM users WHERE id = ?')
      .bind(data.id).first();
    if (!user) return Response.json({ error: 'User tidak ada' }, { status: 401 });
    return Response.json(user);
  } catch {
    return Response.json({ error: 'Session invalid' }, { status: 401 });
  }
}