
import { getUserFromRequest } from '../_auth.js';
export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if(!user) return Response.json({error:'Unauthorized'}, {status:401});
  const { post_id } = await request.json();
  if(!post_id) return Response.json({error:'post_id required'}, {status:400});
  try {
    await env.DB.prepare('INSERT INTO likes (id, post_id, user_id, created_at) VALUES (?,?,?,?)')
      .bind(crypto.randomUUID(), post_id, user.id, Date.now()).run();
  } catch {
    // sudah like -> unlike
    await env.DB.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').bind(post_id, user.id).run();
    return Response.json({liked:false});
  }
  return Response.json({liked:true});
}
