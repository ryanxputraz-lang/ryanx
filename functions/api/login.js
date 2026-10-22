// functions/api/login.js

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: 'Username & password wajib diisi' }, { status: 400 });
    }

    const hash = await sha256(password);

    const user = await env.DB.prepare(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?'
    ).bind(username, hash).first();

    if (!user) {
      return Response.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // 🔒 Buat session token sederhana (HMAC-signed)
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 // 1 hari
    };

    const token = await signToken(payload, env.SESSION_SECRET || 'change-me-secret');

    // Set cookie HttpOnly
    const cookie = [
      `session=${token}`,
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Max-Age=' + 60 * 60 * 24
    ].join('; ');

    return Response.json(
      { ok: true, username: user.username, role: user.role },
      { headers: { 'Set-Cookie': cookie } }
    );
  } catch (err) {
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// Helper: HMAC sign/verify (dipakai juga di me.js & middleware)
async function signToken(payload, secret) {
  const data = btoa(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}