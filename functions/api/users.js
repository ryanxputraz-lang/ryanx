export async function onRequest(context) {
  const { request, env } = context;
  // FIX: support binding DB atau DB1
  const DB = env.DB || env.DB1 || env["ryanx-db"];
  
  if (!DB) {
    return Response.json({ error: "D1 Binding tidak ditemukan! Set Variable name DB atau DB1 di Pages > Settings > Functions > D1 bindings" }, { status: 500 });
  }

  const url = new URL(request.url);

  try {
    if (request.method === "GET") {
      const { results } = await DB.prepare("SELECT id, name, email FROM users ORDER BY id DESC").all();
      return Response.json(results);
    }

    if (request.method === "POST") {
      const { name, email, password } = await request.json();
      if (!name || !email) return Response.json({ error: "Nama & Email wajib" }, { status: 400 });
      const hash = btoa(password); // simple hash biar gak plain
      await DB.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").bind(name, email, hash).run();
      return Response.json({ success: true });
    }

    if (request.method === "PUT") {
      const { id, name, email, password } = await request.json();
      if (password) {
        const hash = btoa(password);
        await DB.prepare("UPDATE users SET name=?, email=?, password=? WHERE id=?").bind(name, email, hash, id).run();
      } else {
        await DB.prepare("UPDATE users SET name=?, email=? WHERE id=?").bind(name, email, id).run();
      }
      return Response.json({ success: true });
    }

    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      await DB.prepare("DELETE FROM users WHERE id=?").bind(id).run();
      return Response.json({ success: true });
    }

  } catch (e) {
    // Ini yang bikin kamu tau error aslinya
    return Response.json({ error: e.message, cause: e.cause?.message }, { status: 500 });
  }

  return new Response("Method Not Allowed", { status: 405 });
}