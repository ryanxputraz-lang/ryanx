
import { getUserFromRequest } from '../_auth.js';
export async function onRequestPut(context) {
  const { request, env } = context;
  const admin = await getUserFromRequest(request, env);
  if(!admin || admin.role!=='admin') return Response.json({error:'Forbidden'}, {status:403});
  const { id, role } = await request.json();
  if(!id || !role) return Response.json({error:'id & role required'}, {status:400});
  await env.DB.prepare('UPDATE users SET role=? WHERE id=?').bind(role, id).run();
  return Response.json({ok:true});
}
export async function onRequestDelete(context) {
  const { request, env } = context;
  const admin = await getUserFromRequest(request, env);
  if(!admin || admin.role!=='admin') return Response.json({error:'Forbidden'}, {status:403});
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if(!id) return Response.json({error:'id required'}, {status:400});
  if(id===admin.id) return Response.json({error:'Tidak bisa hapus diri sendiri'}, {status:400});
  await env.DB.prepare('DELETE FROM users WHERE id=?').bind(id).run();
  return Response.json({ok:true});
}
