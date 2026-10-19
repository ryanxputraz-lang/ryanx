// functions/api/users.js - hanya admin
export async function onRequestGet(context) {
  const { request, env } = context;
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/ryanx_session=([^;]+)/);
  if (!match) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sess = JSON.parse(atob(match[1]));
    if (sess.role !== 'admin') return Response.json({ error: 'Forbidden - admin only' }, { status: 403 });
    const { results } = await env.DB.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY id DESC').all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}