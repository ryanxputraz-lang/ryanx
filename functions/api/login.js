// Path: /api/login
// Login sekarang tinggal cocokin string persis

export async function onRequestPost(context) {
  const { username, password } = await context.request.json();
  const db = context.env.DB1;

  // Cari user dimana username SAMA PERSIS dan password SAMA PERSIS
  // Karena password teks biasa, jadi 'Admin123' != 'admin123'
  const user = await db.prepare(
    "SELECT * FROM users WHERE username = ? AND password = ?"
  ).bind(username, password).first();

  if (!user) {
    return Response.json({ error: "Username atau password salah" }, { status: 401 });
  }

  // Buat token simpel dari data user
  const tokenData = { id: user.id, username: user.username, role: user.role, email: user.email };
  const token = btoa(JSON.stringify(tokenData));

  const headers = new Headers();
  headers.append("Set-Cookie", `token=${token}; Path=/; Max-Age=86400; SameSite=Lax`);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify({ success: true, token, role: user.role }), { headers });
}