// _middleware.js (root)
export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Halaman yang butuh login
  const protectedPaths = ['/user.html', '/admin.html'];
  const needsAuth = protectedPaths.some(p => path.startsWith(p));
  if (!needsAuth) return next();

  // Ambil cookie session
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return Response.redirect(new URL('/', url).toString(), 302);

  const payload = await verifyToken(match[1], env.SESSION_SECRET || 'change-me-secret');
  if (!payload) return Response.redirect(new URL('/', url).toString(), 302);

  // Cek role untuk admin.html
  if (path.startsWith('/admin.html') && payload.role !== 'admin') {
    return Response.redirect(new URL('/user.html', url).toString(), 302);
  }

  return next();
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
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(data));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}