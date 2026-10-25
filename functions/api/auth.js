// PATCH FIX - Paste ini di GitHub
if(action==='send-otp'){
  try{
    const email=(body.email||'').toLowerCase().trim();
    const now=Date.now();
    const existing=await env.DB.prepare('SELECT * FROM otps WHERE email=?').bind(email).first();
    if(existing && existing.resend_available_at>now){
      return Response.json({ok:false,message:`Tunggu ${Math.ceil((existing.resend_available_at-now)/1000)} detik`});
    }
    const code=Math.floor(100000+Math.random()*900000).toString();
    await env.DB.prepare('INSERT OR REPLACE INTO otps (email,code,expires_at,resend_available_at,attempts) VALUES (?,?,?,?,0)').bind(email,code,now+5*60*1000,now+60*1000).run();
    
    // Coba kirim, tapi kalau gagal pun tetap kasih respon
    let sent=false;
    if(env.RESEND_API_KEY){
      try{
        const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:`RyanX <${env.OTP_FROM_EMAIL}>`,to:[email],subject:`OTP RyanX ${code}`,html:`<h1>${code}</h1><p>Berlaku 5 menit</p>`})});
        sent=r.ok;
      }catch(e){ console.log(e); }
    }
    return Response.json({ok:true,message: sent ? `OTP terkirim ke ${email}` : `OTP dibuat: ${code} (email gagal, pakai kode ini)`});
  }catch(e){
    return Response.json({ok:false,message:'Error DB: '+e.message});
  }
}