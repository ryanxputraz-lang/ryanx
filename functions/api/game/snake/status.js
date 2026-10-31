
import {verifyToken} from '../../_middleware.js';
export async function onRequestGet({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const user = await env.DB.prepare("SELECT last_snake_game FROM users WHERE id=?").bind(auth.id).first();
  const cfg = await env.DB.prepare("SELECT value FROM config WHERE key='snake_cooldown_sec'").first();
  const cooldown = parseInt(cfg.value||'120');
  const now = Math.floor(Date.now()/1000);
  const diff = now - (user.last_snake_game||0);
  if(diff >= cooldown) return Response.json({canPlay:true, remaining:0});
  return Response.json({canPlay:false, remaining: cooldown-diff});
}
