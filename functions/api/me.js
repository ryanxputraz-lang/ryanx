// functions/api/me.js

export async function onRequestGet({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return Response.json({ loggedIn: false });

  const payload = await verifyToken(match[1], env.SESSION_SECRET || 'change-me-secret');
  if (!payload) return Response.json({ loggedIn: false });

  return Response.json({
    loggedIn: true,
    username: payload.username,
    role: payload.role
  });
}

async function verifyToken(token, secret) {
  try {
    const [data, sigB64] = token.split('.');
    if (!data || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      'HMAC', key, sigBytes, new TextEncoder().encode(data)
    );
    if (!valid) return null;

    const payload = JSON.parse(atob(data));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}