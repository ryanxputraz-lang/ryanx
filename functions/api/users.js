export async function onRequestGet(context) {
  const db = context.env['ryanx-db'] || context.env.DB || context.env.RYANX_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 binding tidak ketemu' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const { results } = await db.prepare(`SELECT id, username, email, role, created_at FROM users ORDER BY id DESC`).all();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}