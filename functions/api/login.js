
export async function onRequestPost({request, env}){
  const {email,password} = await request.json();
  const hash = await hashPass(password);
  const user = await env.DB.prepare("SELECT * FROM users WHERE email=? AND password_hash=?").bind(email,hash).first();
  if(!user) return Response.json({error:'Email/password salah'}, {status:401});
  const token = makeToken({id:user.id, username:user.username, role:user.role});
  return Response.json({token, user});
}
async function hashPass(p){const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function makeToken(payload){payload.exp=Math.floor(Date.now()/1000)+604800; const b64=btoa(JSON.stringify(payload)); return b64+'.sig';}
