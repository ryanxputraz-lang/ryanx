export async function onRequestGet({ request, env }) {
  const auth = request.headers.get('Authorization');
  if (!auth) return new Response('Unauthorized', { status: 401 });
  
  const token = auth.replace('Bearer ', '');
  try {
    const [id] = atob(token).split(':');
    const user = await env['ryanx-db'].prepare("SELECT id, username, email FROM users WHERE id = ?").bind(id).first();
    if (!user) return new Response('Unauthorized', { status: 401 });
    return Response.json(user);
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
}