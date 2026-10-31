
import {verifyToken} from '../_middleware.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {bet, win, result} = await request.json();
  const cfg = await env.DB.prepare("SELECT value FROM config WHERE key='min_bet'").first();
  if(bet < parseInt(cfg.value)) return Response.json({error:'Bet minimal '+cfg.value},{status:400});
  const user = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  if(user.xpoin < bet) return Response.json({error:'Xpoin tidak cukup'},{status:400});
  const newXpoin = user.xpoin - bet + win;
  await env.DB.prepare("UPDATE users SET xpoin=? WHERE id=?").bind(newXpoin, auth.id).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), auth.id, 'blackjack_'+result, win-bet, Math.floor(Date.now()/1000)).run();
  await env.DB.prepare("INSERT INTO game_history(id,user_id,game,bet,win,result,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'blackjack',bet,win,result,Math.floor(Date.now()/1000)).run();
  return Response.json({xpoin:newXpoin});
}
