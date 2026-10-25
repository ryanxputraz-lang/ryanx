export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const body = request.method==='POST' ? await request.json().catch(()=>({})) : {};

  async function hashPassword(password){
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'}, key, 256);
    return btoa(String.fromCharCode(...salt)+':'+String.fromCharCode(...new Uint8Array(bits)));
  }
  async function verifyPassword(password, stored){
    try{
      const d=atob(stored); const [s,h]=d.split(':');
      const salt=Uint8Array.from(s,c=>c.charCodeAt(0));
      const enc=new TextEncoder();
      const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
      const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256);
      return String.fromCharCode(...new Uint8Array(bits))===h;
    }catch{return false;}
  }
  function genOTP(){ return Math.floor(100000+Math.random()*900000).toString(); }

  // === FUNGSI KIRIM EMAIL BENERAN ===
  async function sendRealEmail(to, code){
    // METODE 1: RESEND (REKOMENDASI, paling gampang)
    // Daftar di resend.com, verifikasi domain ryanx.my.id, dapat API key re_xxx
    // Set di Cloudflare Pages > Settings > Variables > RESEND_API_KEY
    if(env.RESEND_API_KEY){
      const res = await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
        body: JSON.stringify({
          from: `${env.OTP_FROM_NAME||'RyanX'} <${env.OTP_FROM_EMAIL}>`,
          to: [to],
          subject: `[RyanX] Kode OTP kamu ${code} - Berlaku 5 menit`,
          html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#15151f;color:#fff;padding:24px;border-radius:16px">
            <h2 style="color:#6c5cff">RyanX RXC</h2>
            <p>Kode OTP untuk verifikasi akun kamu:</p>
            <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#0f0f18;padding:12px 20px;border-radius:12px;text-align:center;margin:16px 0">${code}</div>
            <p style="font-size:12px;opacity:.7">Berlaku 5 menit. Jangan bagikan ke siapapun. Jika tidak merasa mendaftar, abaikan email ini.<br>Waktu kirim: ${new Date().toLocaleString('id-ID')}</p>
            <p style="font-size:11px;opacity:.5">Cooldown kirim ulang 60 detik. Max 5x salah input.</p>
          </div>`
        })
      });
      const j = await res.json().catch(()=>({}));
      if(!res.ok) console.log('Resend error', j);
      return res.ok;
    }

    // METODE 2: MAILCHANNELS (GRATIS 100%, tanpa API key, tapi domain harus di Cloudflare)
    // Pastikan domain ryanx.my.id sudah di Cloudflare dan SPF tidak di-lock
    try{
      const mc = await fetch('https://api.mailchannels.net/tx/v1/send',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({
          personalizations:[{to:[{email:to}]}],
          from:{email:env.OTP_FROM_EMAIL||'noreply@ryanx.my.id', name:env.OTP_FROM_NAME||'RyanX'},
          subject:`[RyanX] OTP ${code}`,
          content:[{type:'text/html', value:`<h2>Kode OTP RyanX: <b>${code}</b></h2><p>Berlaku 5 menit. Jangan share.</p>`}]
        })
      });
      return mc.ok;
    }catch(e){ console.log('MailChannels fail', e); return false; }
  }

  if(action==='send-otp' && request.method==='POST'){
    const email=(body.email||'').toLowerCase().trim();
    if(!email.includes('@')) return Response.json({ok:false,message:'Email tidak valid'});
    const now=Date.now();
    const existing=await env.DB.prepare('SELECT * FROM otps WHERE email=?').bind(email).first();
    if(existing && existing.resend_available_at>now){
      return Response.json({ok:false,message:`Tunggu ${Math.ceil((existing.resend_available_at-now)/1000)} detik untuk kirim ulang`});
    }
    const code=genOTP();
    const expires_at=now+5*60*1000;
    const resend_available_at=now+60*1000;
    await env.DB.prepare('INSERT OR REPLACE INTO otps (email,code,expires_at,resend_available_at,attempts) VALUES (?,?,?,?,0)').bind(email,code,expires_at,resend_available_at).run();

    const emailSent = await sendRealEmail(email, code);
    // Di dev, tetap kasih code biar gampang tes. Di production, hapus code dari message!
    const isDev = !env.RESEND_API_KEY; // jika belum set api key, anggap dev
    return Response.json({ok:true,message: emailSent ? `OTP terkirim ke ${email}` + (isDev?` (DEV CODE: ${code})`:``) : `Gagal kirim email, cek config. (DEV CODE: ${code})`});
  }

  if(action==='register' && request.method==='POST'){
    const {username,email,password,code}=body;
    if(!username||!email||!password||!code) return Response.json({ok:false,message:'Lengkapi data'});
    if(password.length<6) return Response.json({ok:false,message:'Password min 6'});
    const e=email.toLowerCase().trim();
    const otp=await env.DB.prepare('SELECT * FROM otps WHERE email=?').bind(e).first();
    const now=Date.now();
    if(!otp) return Response.json({ok:false,message:'Kirim OTP dulu'});
    if(otp.expires_at<now) return Response.json({ok:false,message:'OTP kadaluarsa, kirim ulang'});
    if(otp.attempts>=5) return Response.json({ok:false,message:'Terlalu banyak salah, kirim ulang'});
    if(otp.code!==code){ await env.DB.prepare('UPDATE otps SET attempts=attempts+1 WHERE email=?').bind(e).run(); return Response.json({ok:false,message:'OTP salah'}); }
    const exist=await env.DB.prepare('SELECT id FROM users WHERE username=? OR email=?').bind(username,e).first();
    if(exist) return Response.json({ok:false,message:'Username/email sudah dipakai'});
    const id=crypto.randomUUID();
    const password_hash=await hashPassword(password);
    await env.DB.prepare('INSERT INTO users (id,username,email,password_hash,rxc_balance) VALUES (?,?,?,?,100)').bind(id,username,e,password_hash).run();
    await env.DB.prepare('INSERT INTO coin_ledger (id,user_id,amount,source) VALUES (?,?,?,?)').bind(crypto.randomUUID(),id,100,'welcome_bonus').run();
    await env.DB.prepare('DELETE FROM otps WHERE email=?').bind(e).run();
    return Response.json({ok:true,message:'Registrasi sukses! 100 RXC bonus. Silakan login'});
  }

  if(action==='login' && request.method==='POST'){
    const {username,password}=body;
    const u=await env.DB.prepare('SELECT * FROM users WHERE username=?').bind(username).first();
    if(!u) return Response.json({ok:false,message:'User tidak ditemukan'});
    const ok=await verifyPassword(password,u.password_hash);
    if(!ok) return Response.json({ok:false,message:'Password salah'});
    const payload={id:u.id, username:u.username, exp:Date.now()+7*24*3600*1000};
    const token=btoa(JSON.stringify(payload));
    return Response.json({ok:true,message:'Login sukses', token, user:{id:u.id, username:u.username, email:u.email, rxc_balance:u.rxc_balance, avatar_url:u.avatar_url, username_color:u.username_color, border_style:u.border_style, card_bg:u.card_bg, is_admin:u.is_admin}});
  }
  return Response.json({ok:false,message:'Action salah'});
}