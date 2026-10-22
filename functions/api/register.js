export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  if(!db) return Response.json({error:'DB not found'},{status:500});
  const { username, email, password } = await request.json();
  
  const exists = await db.prepare("SELECT id FROM users WHERE username=? OR email=?").bind(username, email).first();
  if(exists) return Response.json({error:'Username atau email sudah dipakai'},{status:400});

  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const expires = Date.now() + 10*60*1000;

  await db.prepare("INSERT INTO users (username,email,password,role,otp,otp_expires,verified) VALUES (?,?,?,?,?,?,0)")
    .bind(username, email, password, 'user', otp, expires).run();

  // KIRIM EMAIL - kalau domain belum verified di Resend, ganti from jadi onboarding@resend.dev dulu buat tes
  const FROM_EMAIL = 'RyanX Scalper <noreply@ryanx.my.id>'; 
  // const FROM_EMAIL = 'onboarding@resend.dev'; // PAKAI INI KALAU BELUM VERIFIED

  try{
    await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `OTP Scalper Squad: ${otp}`,
        html: `<div style="font-family:sans-serif;background:#07080b;color:#fff;padding:28px;border-radius:20px;max-width:420px"><h2 style="color:#facc15;margin:0">ryanx.my.id</h2><p>Halo <b>${username}</b>, ini kode OTP kamu:</p><div style="font-size:34px;font-weight:900;letter-spacing:10px;background:#fff;color:#000;padding:14px;border-radius:14px;text-align:center;margin:18px 0">${otp}</div><p style="color:#aaa;font-size:12px">Berlaku 10 menit. Jangan share ke siapapun.</p></div>`
      })
    });
  }catch(e){ console.log('Resend error', e); }

  return Response.json({success:true});
}