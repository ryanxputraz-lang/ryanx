
import {verifyToken} from '../utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {title,content,image_url,link_url}=await request.json();
  const cfg = await env.DB.prepare("SELECT value FROM config WHERE key='forum_topic_cost'").first();
  const cost = parseInt(cfg.value||'2000');
  const user = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  if(user.xpoin < cost) return Response.json({error:'Xpoin tidak cukup, butuh '+cost},{status:400});
  await env.DB.prepare("UPDATE users SET xpoin=xpoin-? WHERE id=?").bind(cost, auth.id).run();
  await env.DB.prepare("INSERT INTO forum_topics(id,user_id,title,content,image_url,link_url,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,title,content,image_url||'',link_url||'',Math.floor(Date.now()/1000)).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,tax,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'forum_cost',-cost,cost,Math.floor(Date.now()/1000)).run();
  return Response.json({ok:true});
}
