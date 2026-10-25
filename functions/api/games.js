export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const body = request.method==='POST' ? await request.json().catch(()=>({})) : {};
  function getAuth(){ const h=request.headers.get('Authorization')||''; const t=h.replace('Bearer ',''); if(!t) return null; try{ const p=JSON.parse(atob(t)); if(p.exp<Date.now()) return null; return p; }catch{return null;} }
  const auth = getAuth(); if(!auth) return Response.json({ok:false,message:'Unauthorized'});

  async function addCoin(userId, amount, source){
    await env.DB.prepare('UPDATE users SET rxc_balance=rxc_balance+? WHERE id=?').bind(amount,userId).run();
    await env.DB.prepare('INSERT INTO coin_ledger (id,user_id,amount,source) VALUES (?,?,?,?)').bind(crypto.randomUUID(),userId,amount,source).run();
  }

  if(action==='leaderboard'){
    const list = await env.DB.prepare('SELECT username, rxc_balance, username_color FROM users ORDER BY rxc_balance DESC LIMIT 50').bind().all();
    return Response.json({ok:true,list:list.results});
  }

  if(action==='play' && request.method==='POST'){
    const game=body.game;
    const user = await env.DB.prepare('SELECT rxc_balance FROM users WHERE id=?').bind(auth.id).first();
    let cost=0, win=0, msg='';
    if(game==='blekjek'){ cost=10; if(user.rxc_balance<cost) return Response.json({ok:false,message:'RXC kurang'}); const player=Math.floor(Math.random()*11)+12; const dealer=Math.floor(Math.random()*11)+12; if(player>dealer && player<=21){ win=20; msg=`Menang! Kamu ${player} vs Dealer ${dealer} (+20 RXC)`; } else { win=0; msg=`Kalah! Kamu ${player} vs Dealer ${dealer} (-${cost} RXC)`; } }
    else if(game==='roda'){ cost=5; if(user.rxc_balance<cost) return Response.json({ok:false,message:'RXC kurang'}); const r=Math.random(); if(r>0.7){ win=15; msg='Roda Gembira: Jackpot! +15 RXC'; } else if(r>0.4){ win=5; msg='Roda Gembira: Balik modal +5 RXC'; } else { win=0; msg='Roda Gembira: Zonk!'; } }
    else if(game==='bandarq'){ cost=15; if(user.rxc_balance<cost) return Response.json({ok:false,message:'RXC kurang'}); const winChance=Math.random()>0.52; win=winChance?30:0; msg=winChance?`Bandar Q Duel Menang +30 RXC`:`Kalah Bandar Q -${cost} RXC`; }
    else if(game==='ular'){ cost=0; win=1; msg='Ular RXC: +1 RXC (game tanpa judi, lambat tapi aman)'; }
    else if(game==='trading'){ cost=20; if(user.rxc_balance<cost) return Response.json({ok:false,message:'RXC kurang'}); const trend=(Math.random()-0.48)*100; win=trend>0?Math.floor(trend):0; msg=trend>0?`Trading Simulasi Profit +${win} RXC`:`Trading Simulasi Loss -${cost} RXC`; }
    else return Response.json({ok:false,message:'Game tidak dikenal'});

    // Kurangi cost dulu, tambah win
    await env.DB.prepare('UPDATE users SET rxc_balance=rxc_balance-? WHERE id=?').bind(cost,auth.id).run();
    await env.DB.prepare('INSERT INTO coin_ledger (id,user_id,amount,source) VALUES (?,?,?,?)').bind(crypto.randomUUID(),auth.id,-cost,game+'_cost').run();
    if(win>0){ await addCoin(auth.id, win, game+'_win'); }
    const finalBal = user.rxc_balance - cost + win;
    return Response.json({ok:true,message:msg + ` | Saldo: ${finalBal} RXC`});
  }

  return Response.json({ok:false,message:'Action tidak dikenal'});
}