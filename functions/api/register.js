async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        {name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"}, key, 256
    );
    const saltText = Array.from(salt).map(b => b.toString(16).padStart(2,"0")).join("");
    const hashText = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2,"0")).join("");
    return `${saltText}:${hashText}`;
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const name = String(body.name || "").trim();
        const username = String(body.username || "").trim().toLowerCase();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!name || !username || !email || !password) {
            return Response.json({success:false,message:"Semua kolom wajib diisi"}, {status:400});
        }
        if (name.length < 2 || name.length > 100) {
            return Response.json({success:false,message:"Nama harus 2-100 karakter"}, {status:400});
        }
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            return Response.json({success:false,message:"Username harus 3-20 karakter dan hanya huruf kecil, angka, atau garis bawah"}, {status:400});
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Response.json({success:false,message:"Email tidak valid"}, {status:400});
        }
        if (password.length < 8 || password.length > 128) {
            return Response.json({success:false,message:"Password harus 8-128 karakter"}, {status:400});
        }

        const otp = await env.DB.prepare(
            "SELECT id FROM email_otps WHERE email = ? AND verified_at IS NOT NULL AND expires_at > ? AND attempts < 5 ORDER BY id DESC LIMIT 1"
        ).bind(email, new Date().toISOString()).first();

        if (!otp) {
            return Response.json({success:false,message:"Email belum diverifikasi atau OTP sudah kedaluwarsa"}, {status:400});
        }

        const passwordHash = await hashPassword(password);
        const now = new Date().toISOString();

        const results = await env.DB.batch([
            env.DB.prepare(
                "INSERT INTO users (name, username, email, password_hash, role, is_verified) SELECT ?, ?, ?, ?, 'user', 1 WHERE EXISTS (SELECT 1 FROM email_otps WHERE id = ? AND verified_at IS NOT NULL AND expires_at > ? AND attempts < 5)"
            ).bind(name, username, email, passwordHash, otp.id, now),
            env.DB.prepare(
                "DELETE FROM email_otps WHERE id = ? AND EXISTS (SELECT 1 FROM users WHERE email = ?)"
            ).bind(otp.id, email)
        ]);

        if (!results[0].meta.changes) {
            return Response.json({success:false,message:"Registrasi gagal. Periksa verifikasi email."}, {status:400});
        }

        return Response.json({success:true,message:"Registrasi berhasil. Silakan login."});
    } catch (error) {
        return Response.json({success:false,message:"Username atau email mungkin sudah digunakan."}, {status:409});
    }
}
