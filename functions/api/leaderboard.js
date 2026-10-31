
export async function onRequestGet({env}){
  const rows = await env.DB.prepare("SELECT username,xpoin FROM users ORDER BY xpoin DESC LIMIT 100").all();
  return Response.json(rows.results);
}
