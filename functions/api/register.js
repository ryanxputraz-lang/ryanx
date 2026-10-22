export async function onRequestPost({request, env}){
  const {username,email,password}=await request.json();
  if(!username||!email||!password) return Response.json({error:'Lengkapi'}, {status:400});
  const id='u_'+Date.now();
  const hash=await sha256(password);
  try{
    await env.DB.prepare('INSERT INTO users (id,username,email,password_hash,created_at) VALUES (?,?,?,?,?)').bind(id,username,email,hash,Date.now()).run();
    return Response.json({success:true,message:'Daftar berhasil'});
  }catch(e){ return Response.json({error:'Username/email sudah ada'}, {status:400}); }
}
async function sha256(s){ const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); }