export async function onRequestGet({ request, env }) {
    try {
        const cookie = request.headers.get("Cookie") || "";
        const match = cookie.match(/(?:^|;\s*)ryanx_session=([a-f0-9]{64})(?:;|$)/);

        if (!match) {
            return Response.json({success:false,message:"Belum login"}, {status:401});
        }

        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(match[1]));
        const tokenHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");

        const user = await env.DB.prepare(
            "SELECT users.id, users.name, users.username, users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.is_verified = 1"
        ).bind(tokenHash, new Date().toISOString()).first();

        if (!user) {
            return Response.json({success:false,message:"Session tidak valid"}, {status:401});
        }

        return Response.json({success:true,user}, {headers:{"Cache-Control":"no-store"}});
    } catch (error) {
        return Response.json({success:false,message:"Terjadi kesalahan server"}, {status:500});
    }
}
