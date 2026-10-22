export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const { email, otp } = await request.json();
  const user = await db.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
  if(!user) return Response.json({error:'User tidak ditemukan'},{status:404});
  if(user.verified) return Response.json({error:'Akun sudah aktif'},{status:400});
  if(String(user.otp)!==String(otp)) return Response.json({error:'OTP salah'},{status:400});
  if(Date.now() > user.otp_expires) return Response.json({error:'OTP expired, daftar ulang'},{status:400});
  await db.prepare("UPDATE users SET verified=1, otp=NULL, otp_expires=NULL WHERE id=?").bind(user.id).run();
  return Response.json({success:true});
}