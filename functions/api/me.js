
import {verifyToken} from './_middleware.js';
export async function onRequestGet({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const user = await env.DB.prepare("SELECT id,username,email,xpoin,role,headgear,outfit,other FROM users WHERE id=?").bind(auth.id).first();
  return Response.json(user);
}
