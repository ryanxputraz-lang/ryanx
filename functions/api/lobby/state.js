
export async function onRequestGet({request, env}){
  const url=new URL(request.url); const room_id=url.searchParams.get('room_id')||'room1';
  const room = await env.DB.prepare("SELECT * FROM lobby_rooms WHERE room_id=?").bind(room_id).first();
  const now = Math.floor(Date.now()/1000);
  // set offline jika last_seen > 30 detik
  await env.DB.prepare("UPDATE lobby_presence SET status='offline' WHERE last_seen < ?").bind(now-30).run();
  const users = await env.DB.prepare("SELECT lp.*, u.username, u.outfit, u.headgear, u.other FROM lobby_presence lp JOIN users u ON u.id=lp.user_id WHERE lp.room_id=?").bind(room_id).all();
  // chat simpan di KV? untuk simple pakai D1 forum_comments dengan topic_id lobby
  // Untuk MVP, chat diambil dari memori kosong, return empty dulu - bisa pakai D1 jika mau
  return Response.json({users:users.results, max:room?.max_users||15, chats:[]});
}
