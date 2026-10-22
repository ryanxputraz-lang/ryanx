export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const token = (request.headers.get('Authorization')||'').replace('Bearer ','').trim();
  const { id } = await request.json();
  const sess = await db.prepare("SELECT * FROM sessions WHERE token=?").bind(token).first();
  if(!sess) return Response.json({error:'No session'},{status:401});
  const admin = await db.prepare("SELECT username FROM users WHERE id=?").bind(sess.user_id).first();
  if(!admin || admin.username.toLowerCase() !== 'ryanx') return Response.json({error:'Bukan admin'},{status:403});
  if(id==sess.user_id) return Response.json({error:'Tidak bisa hapus diri sendiri'},{status:400});
  await db.prepare("DELETE FROM users WHERE id=?").bind(id).run();
  await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(id).run();
  return Response.json({success:true});
}