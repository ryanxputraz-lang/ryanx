
export async function onRequestGet({env}){
  const rows = await env.DB.prepare("SELECT * FROM shop_items").all();
  return Response.json(rows.results);
}
