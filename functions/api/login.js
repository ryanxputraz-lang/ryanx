// functions/api/login.js - Cloudflare Pages Functions + D1 (ryanx-db)
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'Email dan password wajib' }, { status: 400 });
    }
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    if (!user) {
      return Response.json({ error: 'User tidak ditemukan' }, { status: 401 });
    }
    if (user.password !== password) {
      return Response.json({ error: 'Password salah' }, { status: 401 });
    }
    const sessionData = { id: user.id, email: user.email, role: user.role, username: user.username };
    const token = btoa(JSON.stringify(sessionData));
    return new Response(JSON.stringify({ 
      success: true, 
      user: sessionData 
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `ryanx_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}