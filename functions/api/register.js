
async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        key,
        256
    );

    const saltText = Array.from(salt)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    const hashText = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    return `${saltText}:${hashText}`;
}

export async function onRequestPost({ request, env }) {
    try {
        const { name, username, email, password } =
            await request.json();

        if (!name || !username || !email || !password) {
            return Response.json({
                success: false,
                message: "Semua kolom wajib diisi"
            }, { status: 400 });
        }

        const cleanName = name.trim();
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length < 2 || cleanName.length > 100) {
            return Response.json({
                success: false,
                message: "Nama harus 2-100 karakter"
            }, { status: 400 });
        }

        if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
            return Response.json({
                success: false,
                message: "Username harus 3-20 karakter"
            }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return Response.json({
                success: false,
                message: "Email tidak valid"
            }, { status: 400 });
        }

        if (password.length < 8 || password.length > 128) {
            return Response.json({
                success: false,
                message: "Password harus 8-128 karakter"
            }, { status: 400 });
        }

        const otp = await env.DB.prepare(
            "SELECT id FROM email_otps WHERE email = ? AND verified_at IS NOT NULL AND expires_at > ? AND attempts < 5 ORDER BY id DESC LIMIT 1"
        ).bind(cleanEmail, new Date().toISOString()).first();

        if (!otp) {
            return Response.json({
                success: false,
                message: "Email belum diverifikasi atau OTP sudah kedaluwarsa"
            }, { status: 400 });
        }

        const passwordHash = await hashPassword(password);

        const result = await env.DB.prepare(
            "INSERT INTO users (name, username, email, password_hash, role, is_verified) SELECT ?, ?, ?, ?, 'user', 1 WHERE EXISTS (SELECT 1 FROM email_otps WHERE id = ? AND verified_at IS NOT NULL AND expires_at > ?) RETURNING id, name, username, email, role"
        ).bind(
            cleanName,
            cleanUsername,
            cleanEmail,
            passwordHash,
            otp.id,
            new Date().toISOString()
        ).first();

        if (!result) {
            return Response.json({
                success: false,
                message: "Verifikasi email tidak berlaku"
            }, { status: 400 });
        }

        await env.DB.prepare(
            "DELETE FROM email_otps WHERE email = ?"
        ).bind(cleanEmail).run();

        return Response.json({
            success: true,
            message: "Registrasi berhasil",
            user: result
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Username atau email mungkin sudah digunakan"
        }, { status: 400 });
    }
}
