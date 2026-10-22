export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, email, password } = await request.json();
  const DB = env.DB1;

  if(!username || !email || !password) return Response.json({error:"Lengkapi data"}, {status:400});
  
  const exists = await DB.prepare("SELECT id FROM users WHERE email=? OR username=?").bind(email, username).first();
  if(exists) return Response.json({error:"Username/email sudah dipakai"}, {status:400});

  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const expires = new Date(Date.now()+10*60000).toISOString();

  await DB.prepare("DELETE FROM otps WHERE email=?").bind(email).run();
  await DB.prepare("INSERT INTO otps (email, otp, expires_at) VALUES (?,?,?)").bind(email, otp, expires).run();

  // KIRIM EMAIL VIA MAILCHANNELS (GRATIS DI CLOUDFLARE)
  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      personalizations:[{to:[{email}]}],
      from:{email:"noreply@ryanx.my.id", name:"ry anx.my.id"},
      subject:`Kode OTP kamu: ${otp}`,
      content:[{type:"text/html", value:`<h2 style="color:#D9BD7E">Zona Trader ryanx.my.id</h2><p>Kode OTP verifikasi: <b style="font-size:24px; color:#6CA9E0">${otp}</b></p><p>Berlaku 10 menit.</p>`}]
    })
  });

  return Response.json({message:"OTP terkirim ke email"});
}