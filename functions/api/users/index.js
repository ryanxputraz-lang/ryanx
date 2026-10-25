
import { getUserFromRequest } from '../_auth.js';
export async function onRequestGet(context) {
  const user = await getUserFromRequest(context.request, context.env);
  if(!user) return Response.json({error:'Unauthorized'}, {status:401});
  const { results } = await context.env.DB.prepare('SELECT id, username, display_name, bio, avatar_url, role, created_at FROM users ORDER BY created_at DESC').all();
  return Response.json(results||[]);
}
