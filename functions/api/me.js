export async function onRequest({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return Response.json({ error: 'No token' }, { status: 401 });

  const sess = await db.prepare("SELECT * FROM sessions WHERE token=?").bind(token).first();
  if (!sess) return Response.json({ error: 'Session invalid' }, { status: 401 });
  if (Date.now() > Number(sess.expires)) {
    await db.prepare("DELETE FROM sessions WHERE token=?").bind(token).run();
    return Response.json({ error: 'Session expired' }, { status: 401 });
  }

  const user = await db.prepare("SELECT id, username, email FROM users WHERE id=?").bind(sess.user_id).first();
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  return Response.json({ success: true, user: user });
}