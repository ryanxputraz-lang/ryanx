
import {verifyToken} from '../_middleware.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {item_id}=await request.json();
  const item = await env.DB.prepare("SELECT * FROM shop_items WHERE id=?").bind(item_id).first();
  if(!item) return Response.json({error:'Item tidak ada'},{status:404});
  const user = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  if(user.xpoin < item.price) return Response.json({error:'Xpoin tidak cukup'},{status:400});
  await env.DB.prepare("UPDATE users SET xpoin=xpoin-?, "+item.category+"=? WHERE id=?").bind(item.price, item.id, auth.id).run();
  await env.DB.prepare("INSERT OR IGNORE INTO inventory(user_id,item_id) VALUES(?,?)").bind(auth.id, item_id).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'shop_buy',-item.price,Math.floor(Date.now()/1000)).run();
  const updated = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  return Response.json({xpoin:updated.xpoin});
}
