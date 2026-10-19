export async function onRequestPut(context) {
  const { request, env, params } = context;
  const db = env['ryanx-db'] || env.DB || env.RYANX_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Binding D1 tidak ketemu' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const id = params.id;
    const { username, email, password, role } = await request.json();
    if (password && password.trim() !== '') {
      await db.prepare(`UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?`).bind(username, email, password, role, id).run();
    } else {
      await db.prepare(`UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?`).bind(username, email, role, id).run();
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const db = env['ryanx-db'] || env.DB;
  try {
    await db.prepare(`DELETE FROM users WHERE id = ?`).bind(params.id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}