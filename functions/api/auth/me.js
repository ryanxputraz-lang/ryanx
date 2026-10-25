
import { getUserFromRequest } from '../_auth.js';
export async function onRequestGet(context) {
  const user = await getUserFromRequest(context.request, context.env);
  if(!user) return Response.json({error:'Unauthorized'}, {status:401});
  return Response.json({id:user.id, username:user.username, email:user.email, display_name:user.display_name, bio:user.bio, avatar_url:user.avatar_url, role:user.role});
}
export async function onRequestPut(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if(!user) return Response.json({error:'Unauthorized'}, {status:401});
  const { display_name, bio, avatar_url } = await request.json();
  await env.DB.prepare('UPDATE users SET display_name=?, bio=?, avatar_url=? WHERE id=?')
    .bind(display_name||user.display_name, bio||'', avatar_url||user.avatar_url, user.id).run();
  return Response.json({ok:true});
}
