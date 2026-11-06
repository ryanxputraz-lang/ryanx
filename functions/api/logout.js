
export async function onRequestPost({ request, env }) {
    try {
        const cookie = request.headers.get("Cookie") || "";
        const match = cookie.match(/(?:^|;\s*)ryanx_session=([a-f0-9]+)/);

        if (match) {
            const tokenHashBuffer = await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(match[1])
            );

            const tokenHash = Array.from(
                new Uint8Array(tokenHashBuffer)
            ).map(b => b.toString(16).padStart(2, "0")).join("");

            await env.DB.prepare(
                "DELETE FROM sessions WHERE token_hash = ?"
            ).bind(tokenHash).run();
        }

        return Response.json({
            success: true,
            message: "Logout berhasil"
        }, {
            headers: {
                "Set-Cookie": "ryanx_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Terjadi kesalahan server"
        }, { status: 500 });
    }
}
