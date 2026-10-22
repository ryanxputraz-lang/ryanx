// Fungsi LOGOUT - hapus cookie
export async function onRequestPost() {
  const headers = new Headers();
  // Hapus cookie dengan set Max-Age 0
  headers.append("Set-Cookie", `token=; Path=/; Max-Age=0`);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify({ success: true }), { headers });
}