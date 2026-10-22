export async function onRequest({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const token = (request.headers.get('Authorization')||'').replace('Bearer ','').trim();
  const sess = await db.prepare("SELECT * FROM sessions WHERE token=?").bind(token).first();
  if(!sess) return Response.json({error:'No session'},{status:401});
  const admin = await db.prepare("SELECT username FROM users WHERE id=?").bind(sess.user_id).first();
  if(!admin || admin.username.toLowerCase() !== 'ryanx') return Response.json({error:'Bukan admin'},{status:403});
  const users = await db.prepare("SELECT id, username, email, verified, created_at FROM users ORDER BY id DESC").all();
  return Response.json({success:true, users: users.results});
}