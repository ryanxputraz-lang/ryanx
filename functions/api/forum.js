
export async function onRequestGet({env}){
  const rows = await env.DB.prepare("SELECT ft.*, u.username FROM forum_topics ft JOIN users u ON u.id=ft.user_id ORDER BY ft.created_at DESC LIMIT 50").all();
  return Response.json(rows.results);
}
