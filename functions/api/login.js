export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();
  const db = env['ryanx-db'];
  
  const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
  if (!user) return Response.json({ error: "Username tidak ditemukan" }, { status: 401 });

  // Untuk sekarang pakai perbandingan plain, nanti kita upgrade ke hash
  // Kalau kamu sudah hash, ganti pakai crypto.subtle
  if (user.password !== password) {
    return Response.json({ error: "Password salah" }, { status: 401 });
  }

  // Buat token sederhana (nanti kita upgrade ke JWT + OTP email)
  const token = btoa(`${user.id}:${user.username}:${Date.now()}`);
  
  return Response.json({ 
    success: true, 
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
}