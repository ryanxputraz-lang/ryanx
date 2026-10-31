
import {verifyToken} from '../utils.js';
export async function onRequestGet({request, env}){
  const auth = await verifyToken(request, env); if(!auth||auth.role!=='admin') return Response.json({error:'Admin only'},{status:403});
  const rows = await env.DB.prepare("SELECT * FROM xpoin_log WHERE tax>0 ORDER BY created_at DESC LIMIT 100").all();
  return Response.json(rows.results);
}
