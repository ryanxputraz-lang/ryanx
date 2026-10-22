// Path: /api/register
// Sekarang kita simpan password apa adanya, tanpa di-hash

export async function onRequestPost(context) {
  try {
    const { username, email, password } = await context.request.json();
    const db = context.env.DB1;

    if (!username || !email || !password) {
      return Response.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    // Langsung simpan password teks polos
    // Contoh: user ketik 'kucing123' -> di DB kesimpan 'kucing123'
    await db.prepare(
      "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 'user')"
    ).bind(username, password, email).run();

    return Response.json({ success: true, message: "Registrasi berhasil" });

  } catch (e) {
    if (e.message.includes("UNIQUE")) {
      return Response.json({ error: "Username atau email sudah dipakai" }, { status: 400 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}