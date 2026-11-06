export async function onRequest({ request, env, next }) {
    const path = new URL(request.url).pathname;

    if (path !== "/user.html" && path !== "/admin.html") {
        return next();
    }

    try {
        const cookie = request.headers.get("Cookie") || "";
        const match = cookie.match(/(?:^|;\s*)ryanx_session=([a-f0-9]{64})(?:;|$)/);

        if (!match) {
            return Response.redirect(new URL("/", request.url), 302);
        }

        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(match[1]));
        const tokenHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");

        const user = await env.DB.prepare(
            "SELECT users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.is_verified = 1"
        ).bind(tokenHash, new Date().toISOString()).first();

        if (!user) {
            return Response.redirect(new URL("/", request.url), 302);
        }

        if (path === "/admin.html" && user.role !== "admin") {
            return Response.redirect(new URL("/user.html", request.url), 302);
        }

        if (path === "/user.html" && user.role !== "user") {
            return Response.redirect(new URL("/admin.html", request.url), 302);
        }

        return next();
    } catch (error) {
        return new Response("Server error", {status:500});
    }
}
