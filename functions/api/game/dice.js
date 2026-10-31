
import {verifyToken} from '../utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {bet, bet_type, bet_value} = await request.json();
  const user = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  if(user.xpoin < bet) return Response.json({error:'XP tidak cukup'},{status:400});
  const dice = Math.floor(Math.random()*6)+1;
  let win=0;
  if(bet_type=='besar' && dice>=4) win=bet*2;
  if(bet_type=='kecil' && dice<=3) win=bet*2;
  if(bet_type=='ganjil' && dice%2==1) win=bet*2;
  if(bet_type=='genap' && dice%2==0) win=bet*2;
  if(bet_type=='angka' && parseInt(bet_value)==dice) win=bet*6;
  const taxCfg = await env.DB.prepare("SELECT value FROM config WHERE key='transfer_tax_percent'").first();
  const tax = win>0? Math.floor(win*parseInt(taxCfg.value||'10')/100):0;
  const netWin = win - tax;
  const newX = user.xpoin - bet + netWin + (win==0?0:0); // if lose, already deducted
  // Actually if lose, newX = old - bet
  const finalX = win>0? user.xpoin - bet + netWin : user.xpoin - bet;
  // jika win=0 berarti kalah, jika win>0 tapi draw? dice logic diatas sudah handle
  // Untuk draw di blackjack sudah handle, di dice tidak ada draw
  await env.DB.prepare("UPDATE users SET xpoin=? WHERE id=?").bind(finalX, auth.id).run();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,tax,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'dice',win>0?netWin-bet:-bet,tax,Math.floor(Date.now()/1000)).run();
  await env.DB.prepare("INSERT INTO dice_history(id,user_id,bet_type,bet_value,dice_result,win,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,bet_type,bet_value,String(dice),win>0?netWin:0,Math.floor(Date.now()/1000)).run();
  return Response.json({dice, win:win>0?netWin:0, xpoin:finalX, tax});
}
