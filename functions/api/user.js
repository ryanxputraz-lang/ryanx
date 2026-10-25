export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const body = request.method==='POST' ? await request.json().catch(()=>({})) : {};

  // Auth sederhana
  function getAuth(){
    const h = request.headers.get('Authorization')||'';
    const t = h.replace('Bearer ','');
    if(!t) return null;
    try{ const p = JSON.parse(atob(t)); if(p.exp < Date.now()) return null; return p; }catch{ return null; }
  }
  const auth = getAuth();
  if(!auth && action!=='posts') return Response.json({ok:false,message:'Unauthorized'});

  async function hashPassword(p){ const enc=new TextEncoder(); const salt=crypto.getRandomValues(new Uint8Array(16)); const key=await crypto.subtle.importKey('raw',enc.encode(p),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256); const ha=new Uint8Array(bits); return btoa(String.fromCharCode(...salt)+':'+String.fromCharCode(...ha)); }
  async function verifyPassword(p,stored){ try{ const d=atob(stored); const [s,h]=d.split(':'); const salt=Uint8Array.from(s,c=>c.charCodeAt(0)); const enc=new TextEncoder(); const key=await crypto.subtle.importKey('raw',enc.encode(p),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256); const ha=new Uint8Array(bits); return String.fromCharCode(...ha)===h; }catch{return false;} }

  if(action==='me'){
    const u = await env.DB.prepare('SELECT id,username,email,rxc_balance,avatar_url,username_color,border_style,card_bg,is_admin FROM users WHERE id=?').bind(auth.id).first();
    return Response.json({ok:true,user:u});
  }
  if(action==='update-avatar'){
    await env.DB.prepare('UPDATE users SET avatar_url=? WHERE id=?').bind(body.avatar_url,auth.id).run();
    return Response.json({ok:true,message:'Avatar diupdate'});
  }
  if(action==='change-password'){
    const {oldPass,newPass,code}=body;
    const u = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(auth.id).first();
    const ok = await verifyPassword(oldPass,u.password_hash);
    if(!ok) return Response.json({ok:false,message:'Password lama salah'});
    // Cek OTP lagi untuk ganti password (keamanan)
    const otp = await env.DB.prepare('SELECT * FROM otps WHERE email=?').bind(u.email).first();
    if(!otp||otp.code!==code||otp.expires_at<Date.now()) return Response.json({ok:false,message:'OTP tidak valid/kadaluarsa'});
    const newHash = await hashPassword(newPass);
    await env.DB.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(newHash,auth.id).run();
    await env.DB.prepare('DELETE FROM otps WHERE email=?').bind(u.email).run();
    return Response.json({ok:true,message:'Password berhasil diganti'});
  }
  if(action==='create-post'){
    const cost=10;
    const u = await env.DB.prepare('SELECT rxc_balance FROM users WHERE id=?').bind(auth.id).first();
    if(u.rxc_balance < cost) return Response.json({ok:false,message:'RXC tidak cukup (butuh 10)'});
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO posts (id,user_id,content,cost) VALUES (?,?,?,?)').bind(id,auth.id,body.content,cost).run();
    await env.DB.prepare('UPDATE users SET rxc_balance=rxc_balance-? WHERE id=?').bind(cost,auth.id).run();
    await env.DB.prepare('INSERT INTO coin_ledger (id,user_id,amount,source) VALUES (?,?,?,?)').bind(crypto.randomUUID(),auth.id,-cost,'forum_post').run();
    return Response.json({ok:true,message:'Postingan dibuat (-10 RXC)'});
  }
  if(action==='posts'){
    const posts = await env.DB.prepare('SELECT p.*, u.username, u.username_color FROM posts p JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC LIMIT 20').bind().all();
    // attach comments
    for(let p of posts.results){ const cm = await env.DB.prepare('SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? ORDER BY c.created_at ASC').bind(p.id).all(); p.comments=cm.results; }
    return Response.json({ok:true,list:posts.results});
  }
  if(action==='comment'){
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO comments (id,post_id,user_id,content) VALUES (?,?,?,?)').bind(id,body.postId,auth.id,body.content).run();
    return Response.json({ok:true,message:'Komentar ditambahkan'});
  }
  if(action==='buy-shop'){
    const u = await env.DB.prepare('SELECT rxc_balance FROM users WHERE id=?').bind(auth.id).first();
    if(u.rxc_balance < body.cost) return Response.json({ok:false,message:'RXC tidak cukup'});
    let field=''; if(body.type==='color') field='username_color'; if(body.type==='border') field='border_style'; if(body.type==='bg') field='card_bg';
    await env.DB.prepare(`UPDATE users SET ${field}=?, rxc_balance=rxc_balance-? WHERE id=?`).bind(body.value,body.cost,auth.id).run();
    await env.DB.prepare('INSERT INTO coin_ledger (id,user_id,amount,source) VALUES (?,?,?,?)').bind(crypto.randomUUID(),auth.id,-body.cost,'shop_'+body.type).run();
    return Response.json({ok:true,message:'Item shop dibeli'});
  }
  if(action==='request-coin'){
    await env.DB.prepare('INSERT INTO inbox (id,user_id,message) VALUES (?,?,?)').bind(crypto.randomUUID(),auth.id,'User meminta koin dari admin').run();
    // Simpan request di ledger admin bisa lihat
    return Response.json({ok:true,message:'Permintaan koin terkirim ke admin'});
  }
  if(action==='send-coin'){
    const amount=parseInt(body.amount); if(amount<=0) return Response.json({ok:false,message:'Jumlah tidak valid'});
    const from = await env.DB.prepare('SELECT rxc_balance FROM users WHERE id=?').bind(auth.id).first();
    if(from.rxc_balance < amount) return Response.json({ok:false,message:'Saldo tidak cukup'});
    const toUser = await env.DB.prepare('SELECT id FROM users WHERE username=?').bind(body.to).first();
    if(!toUser) return Response.json({ok:false,message:'User tujuan tidak ditemukan'});
    await env.DB.prepare('UPDATE users SET rxc_balance=rxc_balance-? WHERE id=?').bind(amount,auth.id).run();
    await env.DB.prepare('UPDATE users SET rxc_balance=rxc_balance+? WHERE id=?').bind(amount,toUser.id).run();
    await env.DB.prepare('INSERT INTO coin_ledger (id,user_id,amount,source) VALUES (?,?,?,?)').bind(crypto.randomUUID(),auth.id,-amount,'send_to_'+body.to).run();
    await env.DB.prepare('INSERT INTO coin_ledger (id,user_id,amount,source) VALUES (?,?,?,?)').bind(crypto.randomUUID(),toUser.id,amount,'receive_from_'+auth.username).run();
    return Response.json({ok:true,message:`Berhasil kirim ${amount} RXC ke ${body.to}`});
  }
  if(action==='inbox'){
    const list = await env.DB.prepare('SELECT * FROM inbox WHERE user_id=? ORDER BY created_at DESC LIMIT 20').bind(auth.id).all();
    return Response.json({ok:true,list:list.results});
  }
  return Response.json({ok:false,message:'Action tidak dikenal'});
}