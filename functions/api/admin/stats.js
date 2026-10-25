
import { getUserFromRequest } from '../_auth.js';
export async function onRequestGet(context) {
  const user = await getUserFromRequest(context.request, context.env);
  if(!user || user.role!=='admin') return Response.json({error:'Forbidden'}, {status:403});
  const users = await context.env.DB.prepare('SELECT COUNT(*) as c FROM users').first();
  const posts = await context.env.DB.prepare('SELECT COUNT(*) as c FROM posts').first();
  const likes = await context.env.DB.prepare('SELECT COUNT(*) as c FROM likes').first();
  return Response.json({users: users.c, posts: posts.c, likes: likes.c});
}
