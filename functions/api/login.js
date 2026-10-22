async function hashPass(pass){
  const enc = new TextEncoder().encode(pass);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function onRequestPost({request, env}){
  const {username, password} = await request.json();
  const DB = env.DB1;
  let user = await DB.prepare("SELECT * FROM users WHERE username=?").bind(username).first();
  // special admin login plain check untuk id 1 sesuai requestmu
  if(user && user.id===1 && user.password_hash==='@Ryanx2026' && password==='@Ryanx2026'){
     const newHash = await hashPass(password);
     await DB.prepare("UPDATE users SET password_hash=? WHERE id=1").bind(newHash).run();
     user.password_hash = newHash;
  }
  if(!user) return Response.json({error:"User tidak ditemukan"}, {status:404});
  const hash = await hashPass(password);
  if(user.password_hash !== hash && user.password_hash !== password) return Response.json({error:"Password salah"}, {status:401});
  
  // token simple
  const token = btoa(JSON.stringify({id:user.id, role:user.role, username:user.username}));
  return Response.json({token, user:{id:user.id, username:user.username, role:user.role, avatar:user.avatar}});
}