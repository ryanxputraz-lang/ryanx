
import {verifyToken} from '../utils.js';
export async function onRequestGet({request, env}){
  const auth = await verifyToken(request, env); if(!auth||auth.role!=='admin') return Response.json({error:'Admin only'},{status:403});
  const url=new URL(request.url); const search=url.searchParams.get('search')||'';
  const rows = await env.DB.prepare("SELECT id,username,email,xpoin,role FROM users WHERE username LIKE ? LIMIT 50").bind('%'+search+'%').all();
  return Response.json(rows.results);
}
