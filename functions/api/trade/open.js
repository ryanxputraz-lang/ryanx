
import {verifyToken} from '../utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {dir, amount, tf} = await request.json();
  const user = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  if(user.xpoin < amount) return Response.json({error:'Xpoin tidak cukup'},{status:400});
  // ambil last candle
  const last = await env.DB.prepare("SELECT close FROM trade_candles WHERE timeframe=? ORDER BY timestamp DESC LIMIT 1").bind(tf).first();
  const entry = last?.close||1000;
  // untuk MVP, langsung settle setelah 1 candle (demo): 50% win - tapi ada tax 10%
  const win = Math.random()>0.5;
  const profit = win? amount : -amount;
  await env.DB.prepare("UPDATE users SET xpoin=xpoin+? WHERE id=?").bind(profit, auth.id).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'trade_'+dir,profit,Math.floor(Date.now()/1000)).run();
  const updated = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  return Response.json({entry, win, xpoin:updated.xpoin});
}
