export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const body = request.method==='POST' ? await request.json().catch(()=>({})) : {};
  function getAuth(){ const h=request.headers.get('Authorization')||''; const t=h.replace('Bearer ',''); if(!t) return null; try{ const p=JSON.parse(atob(t)); if(p.exp<Date.now()) return null; return p; }catch{return null;} }
  const auth = getAuth(); if(!auth) return Response.json({ok:false,message:'Unauthorized'});
  const me = await env.DB.prepare('SELECT is_admin FROM users WHERE id=?').bind(auth.id).first();
  if(!me || !me.is_admin) return Response.json({ok:false,message:'Bukan admin'});

  if(action==='stats'){
    const total = await env.DB.prepare('SELECT SUM(rxc_balance) as total FROM users').first();
    const count = await env.DB.prepare('SELECT COUNT(*) as c FROM users').first();
    return Response.json({ok:true,totalCoins:total.total||0,totalUsers:count.c});
  }
  if(action==='search'){
    const q = url.searchParams.get('q')||'';
    const list = await env.DB.prepare('SELECT id,username,email,rxc_balance FROM users WHERE username LIKE ? LIMIT 20').bind(`%${q}%`).all();
    return Response.json({ok:true,list:list.results});
  }
  if(action==='update-coin'){
    await env.DB.prepare('UPDATE users SET rxc_balance=? WHERE id=?').bind(body.rxc_balance,body.id).run();
    return Response.json({ok:true,message:'Koin diupdate admin'});
  }
  if(action==='delete-user'){
    await env.DB.prepare('DELETE FROM users WHERE id=?').bind(body.id).run();
    return Response.json({ok:true,message:'User dihapus'});
  }
  if(action==='send-inbox'){
    if(body.target==='ALL'){
      const users = await env.DB.prepare('SELECT id FROM users').all();
      for(let u of users.results){ await env.DB.prepare('INSERT INTO inbox (id,user_id,message) VALUES (?,?,?)').bind(crypto.randomUUID(),u.id,body.message).run(); }
    } else {
      const target = await env.DB.prepare('SELECT id FROM users WHERE username=?').bind(body.target).first();
      if(!target) return Response.json({ok:false,message:'Target tidak ditemukan'});
      await env.DB.prepare('INSERT INTO inbox (id,user_id,message) VALUES (?,?,?)').bind(crypto.randomUUID(),target.id,body.message).run();
    }
    return Response.json({ok:true,message:'Inbox terkirim'});
  }
  return Response.json({ok:false,message:'Action admin tidak dikenal'});
}