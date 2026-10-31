
import {verifyToken} from '../_middleware.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth||auth.role!=='admin') return Response.json({error:'Admin only'},{status:403});
  const {text}=await request.json();
  await env.DB.prepare("INSERT OR REPLACE INTO config(key,value) VALUES('announcement',?)").bind(text).run();
  return Response.json({ok:true});
}
