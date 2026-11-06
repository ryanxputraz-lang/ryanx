export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Response.json({success:false,message:"Email tidak valid"}, {status:400});
        }

        const existing = await env.DB.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();

        if (existing) {
            return Response.json({success:false,message:"Email sudah terdaftar"}, {status:409});
        }

        const recent = await env.DB.prepare(
            "SELECT created_at FROM email_otps WHERE email = ? ORDER BY id DESC LIMIT 1"
        ).bind(email).first();

        if (recent && Date.now() - Date.parse(recent.created_at + "Z") < 60000) {
            return Response.json({success:false,message:"Tunggu 60 detik sebelum meminta OTP lagi"}, {status:429});
        }

        const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
        const code = String(random).padStart(6, "0");
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
        const otpHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const mail = await fetch("https://api.resend.com/emails", {
            method:"POST",
            headers:{
                "Authorization":`Bearer ${env.RESEND_API_KEY}`,
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                from:"RYANX <noreply@ryanx.my.id>",
                to:[email],
                subject:"Kode OTP RYANX",
                html:`<div style="background:#111827;padding:30px;color:white;text-align:center;font-family:Arial"><h1 style="color:#e5c477">RYANX</h1><h2>Verifikasi Email</h2><p>Kode OTP kamu:</p><h1 style="color:#e5c477;letter-spacing:8px">${code}</h1><p>Kode berlaku selama 5 menit.</p></div>`
            })
        });

        if (!mail.ok) {
            return Response.json({success:false,message:"Gagal mengirim email OTP. Periksa konfigurasi Resend."}, {status:502});
        }

        await env.DB.prepare("DELETE FROM email_otps WHERE email = ?").bind(email).run();
        await env.DB.prepare(
            "INSERT INTO email_otps (email, otp_hash, expires_at) VALUES (?, ?, ?)"
        ).bind(email, otpHash, expiresAt).run();

        return Response.json({success:true,message:"OTP berhasil dikirim ke email."});
    } catch (error) {
        return Response.json({success:false,message:"Terjadi kesalahan server."}, {status:500});
    }
}
