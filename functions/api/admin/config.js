
import {verifyToken} from '../_middleware.js';
export async function onRequestGet({request, env}){
  const auth = await verifyToken(request, env); if(!auth||auth.role!=='admin') return Response.json({error:'Admin only'},{status:403});
  const rows = await env.DB.prepare("SELECT key,value FROM config").all();
  const obj={}; rows.results.forEach(r=>obj[r.key]=r.value); return Response.json(obj);
}
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth||auth.role!=='admin') return Response.json({error:'Admin only'},{status:403});
  const data = await request.json();
  for(let k in data){await env.DB.prepare("INSERT OR REPLACE INTO config(key,value) VALUES(?,?)").bind(k, String(data[k])).run()}
  return Response.json({ok:true});
}
