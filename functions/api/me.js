// Fungsi untuk CEK STATUS LOGIN
// Dipanggil oleh index.html untuk auto-redirect kalau sudah login

export async function onRequestGet(context) {
  // Ambil token dari header Authorization atau Cookie
  const auth = context.request.headers.get("Authorization");
  let token = null;

  if (auth && auth.startsWith("Bearer ")) {
    token = auth.replace("Bearer ", "");
  } else {
    // Coba dari cookie
    const cookie = context.request.headers.get("Cookie") || "";
    const match = cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return Response.json({ loggedIn: false }, { status: 401 });

  try {
    // Decode token
    const data = JSON.parse(atob(token));
    return Response.json({ loggedIn: true, user: data });
  } catch {
    return Response.json({ loggedIn: false }, { status: 401 });
  }
}