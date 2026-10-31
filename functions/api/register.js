
export async function onRequestPost({request, env}){
  const {username,email,password} = await request.json();
  if(!username||!email||!password) return Response.json({error:'Lengkapi data'}, {status:400});
  const id = crypto.randomUUID();
  const hash = await hashPassword(password);
  // ambil config new_user_xpoin
  const cfg = await env.DB.prepare("SELECT value FROM config WHERE key='new_user_xpoin'").first();
  const xpoin = parseInt(cfg?.value||'1000');
  try{
    await env.DB.prepare("INSERT INTO users(id,username,email,password_hash,xpoin,created_at) VALUES(?,?,?,?,?,?)").bind(id,username,email,hash,xpoin, Math.floor(Date.now()/1000)).run();
  }catch(e){return Response.json({error:'Username/email sudah dipakai'}, {status:400})}
  const token = makeToken({id, username, role:'user'});
  return Response.json({token, user:{id,username,email,xpoin}});
}
async function hashPassword(p){const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function makeToken(payload){payload.exp=Math.floor(Date.now()/1000)+604800; const b64=btoa(JSON.stringify(payload)); return b64+'.sig';}
