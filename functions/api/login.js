export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const { email, password } = await request.json();
  const user = await db.prepare("SELECT id, username, email, verified FROM users WHERE email=? AND password=?").bind(email, password).first();
  if(!user) return Response.json({error:'Email atau password salah'},{status:401});
  if(!user.verified) return Response.json({error:'Akun belum verifikasi OTP. Cek email!'},{status:403});
  return Response.json({ success:true, user: { id:user.id, username:user.username, email:user.email } });
}