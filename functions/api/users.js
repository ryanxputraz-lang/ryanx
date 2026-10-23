export async function onRequest(context) {
  const { request, env } = context;
  const DB = env.DB; // Binding D1 kamu harus namanya DB
  const url = new URL(request.url);

  // GET - Read all users
  if (request.method === "GET") {
    const { results } = await DB.prepare("SELECT id, name, email FROM users ORDER BY id DESC").all();
    return Response.json(results);
  }

  // POST - Create
  if (request.method === "POST") {
    const { name, email, password } = await request.json();
    const hash = await hashPassword(password);
    await DB.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").bind(name, email, hash).run();
    return Response.json({ success: true });
  }

  // PUT - Update
  if (request.method === "PUT") {
    const { id, name, email, password } = await request.json();
    if (password) {
      const hash = await hashPassword(password);
      await DB.prepare("UPDATE users SET name=?, email=?, password=? WHERE id=?").bind(name, email, hash, id).run();
    } else {
      await DB.prepare("UPDATE users SET name=?, email=? WHERE id=?").bind(name, email, id).run();
    }
    return Response.json({ success: true });
  }

  // DELETE
  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    await DB.prepare("DELETE FROM users WHERE id=?").bind(id).run();
    return Response.json({ success: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

async function hashPassword(pw){
  const enc = new TextEncoder().encode(pw);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
