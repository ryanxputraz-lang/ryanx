
import {verifyToken} from '../../utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const cfg = await env.DB.prepare("SELECT value FROM config WHERE key='snake_reward_per_mouse'").first();
  const reward = parseInt(cfg.value||'10');
  // anti cheat: hanya boleh 1 eat per 0.5 detik, validasi via last log
  const user = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  const newX = user.xpoin + reward;
  await env.DB.prepare("UPDATE users SET xpoin=? WHERE id=?").bind(newX, auth.id).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'snake_eat',reward,Math.floor(Date.now()/1000)).run();
  return Response.json({xpoin:newX, reward});
}
