async function hashPass(pass){
  const enc = new TextEncoder().encode(pass);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function onRequestPost({request, env}){
  const {username, email, password, otp} = await request.json();
  const DB = env.DB1;
  const row = await DB.prepare("SELECT * FROM otps WHERE email=? AND otp=? AND used=0 ORDER BY id DESC").bind(email, otp).first();
  if(!row) return Response.json({error:"OTP salah"}, {status:400});
  if(new Date(row.expires_at) < new Date()) return Response.json({error:"OTP expired"}, {status:400});

  await DB.prepare("UPDATE otps SET used=1 WHERE id=?").bind(row.id).run();
  const hash = await hashPass(password);
  await DB.prepare("INSERT INTO users (username, email, password_hash, role, verified) VALUES (?,?,?,?,?)")
    .bind(username, email, hash, 'user', 1).run();
  
  return Response.json({message:"Akun berhasil dibuat, silakan login"});
}