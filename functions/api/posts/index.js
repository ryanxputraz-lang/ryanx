
import { getUserFromRequest } from '../_auth.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')||'50'), 100);
  const { results } = await env.DB.prepare(`
    SELECT posts.*, users.username, users.display_name, users.avatar_url,
    (SELECT COUNT(*) FROM likes WHERE likes.post_id=posts.id) as like_count
    FROM posts JOIN users ON posts.user_id=users.id
    ORDER BY posts.created_at DESC LIMIT ?
  `).bind(limit).all();
  return Response.json(results||[]);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if(!user) return Response.json({error:'Unauthorized'}, {status:401});
  const { content } = await request.json();
  if(!content || content.trim().length < 2) return Response.json({error:'Konten minimal 2 karakter'}, {status:400});
  if(content.length > 1000) return Response.json({error:'Maks 1000 karakter'}, {status:400});
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO posts (id, user_id, content, created_at) VALUES (?,?,?,?)')
    .bind(id, user.id, content.trim(), Date.now()).run();
  return Response.json({ok:true, id});
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if(!user) return Response.json({error:'Unauthorized'}, {status:401});
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if(!id) return Response.json({error:'id required'}, {status:400});
  // owner atau admin boleh hapus
  const post = await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(id).first();
  if(!post) return Response.json({error:'Not found'}, {status:404});
  if(post.user_id !== user.id && user.role !== 'admin') return Response.json({error:'Forbidden'}, {status:403});
  await env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id).run();
  return Response.json({ok:true});
}
