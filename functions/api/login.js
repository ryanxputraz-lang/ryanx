
async function hashPassword(password, salt) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const result = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        key,
        256
    );

    return Array.from(new Uint8Array(result))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return Response.json({
                success: false,
                message: "Username dan password wajib diisi"
            }, { status: 400 });
        }

        const user = await env.DB.prepare(
            "SELECT * FROM users WHERE username = ? AND is_verified = 1"
        ).bind(username.trim().toLowerCase()).first();

        if (!user) {
            return Response.json({
                success: false,
                message: "Username atau password salah"
            }, { status: 401 });
        }

        const [saltText, savedHash] = user.password_hash.split(":");

        const salt = new Uint8Array(
            saltText.match(/.{2}/g).map(x => parseInt(x, 16))
        );

        const passwordHash = await hashPassword(password, salt);

        if (passwordHash !== savedHash) {
            return Response.json({
                success: false,
                message: "Username atau password salah"
            }, { status: 401 });
        }

        const tokenBytes = crypto.getRandomValues(
            new Uint8Array(32)
        );

        const token = Array.from(tokenBytes)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        const tokenHashBuffer = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(token)
        );

        const tokenHash = Array.from(
            new Uint8Array(tokenHashBuffer)
        ).map(b => b.toString(16).padStart(2, "0")).join("");

        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        await env.DB.prepare(
            "DELETE FROM sessions WHERE expires_at <= ?"
        ).bind(new Date().toISOString()).run();

        await env.DB.prepare(
            "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)"
        ).bind(user.id, tokenHash, expiresAt).run();

        return Response.json({
            success: true,
            message: "Login berhasil",
            role: user.role,
            user: {
                id: user.id,
                name: user.name,
                username: user.username
            }
        }, {
            headers: {
                "Set-Cookie": `ryanx_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Terjadi kesalahan server"
        }, { status: 500 });
    }
}
