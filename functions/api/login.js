export async function onRequestPost({request, env}){
  const {email,password}=await request.json();
  const hash=await sha256(password);
  const user=await env.DB.prepare('SELECT * FROM users WHERE email=? AND password_hash=?').bind(email,hash).first();
  if(!user) return Response.json({error:'Email/password salah'},{status:401});
  const token=btoa(JSON.stringify({id:user.id,role:user.role,exp:Date.now()+86400000*7}));
  return Response.json({token, user:{id:user.id,username:user.username,role:user.role}});
}
async function sha256(s){ const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); }