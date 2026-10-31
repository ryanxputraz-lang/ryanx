
import {verifyToken} from './utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {to, amount} = await request.json();
  if(amount<10) return Response.json({error:'Minimal 10'},{status:400});
  const taxCfg = await env.DB.prepare("SELECT value FROM config WHERE key='transfer_tax_percent'").first();
  const taxP = parseInt(taxCfg.value||'10');
  const tax = Math.floor(amount*taxP/100);
  const totalDeduct = amount;
  const receiver = await env.DB.prepare("SELECT id,xpoin FROM users WHERE username=?").bind(to).first();
  if(!receiver) return Response.json({error:'User tidak ditemukan'},{status:404});
  const sender = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  if(sender.xpoin < totalDeduct) return Response.json({error:'Xpoin tidak cukup'},{status:400});
  await env.DB.prepare("UPDATE users SET xpoin=xpoin-? WHERE id=?").bind(totalDeduct, auth.id).run();
  await env.DB.prepare("UPDATE users SET xpoin=xpoin+? WHERE id=?").bind(amount-tax, receiver.id).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,tax,note,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'transfer_out',-amount,tax,'to:'+to,Math.floor(Date.now()/1000)).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), receiver.id,'transfer_in',amount-tax,Math.floor(Date.now()/1000)).run();
  return Response.json({ok:true, tax});
}
