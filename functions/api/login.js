export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const body = await request.json();
  let email = (body.email || '').trim().toLowerCase();
  let password = (body.password || '').trim();

  if(!email || !password) return Response.json({error:'Isi email & password'},{status:400});

  // cari pakai lower biar gak sensitif huruf besar/kecil
  const user = await db.prepare("SELECT id, username, email, password, verified FROM users WHERE LOWER(email)=?").bind(email).first();
  
  if(!user) return Response.json({error:'Email tidak ditemukan'},{status:401});
  if(String(user.password).trim() !== String(password)) {
    return Response.json({error:`Password salah. Kamu daftar pakai password: [${user.password.length} karakter]`},{status:401});
  }
  if(!user.verified) return Response.json({error:'Akun belum verifikasi OTP. Cek email & spam!'},{status:403});

  return Response.json({ success:true, user: { id:user.id, username:user.username, email:user.email } });
}