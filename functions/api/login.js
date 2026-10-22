export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const db = env['ryanx-db'] || env.ryanx_db || env.DB;
    
    const user = await db.prepare(
      "SELECT * FROM users WHERE username = ? AND password = ?"
    ).bind(username, password).first();

    if (!user) {
      return Response.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // token simpel
    const token = btoa(`${user.id}:${user.username}:${Date.now()}`);

    return Response.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}