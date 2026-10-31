
export async function onRequestGet({env}){
  const rows = await env.DB.prepare("SELECT key,value FROM config").all();
  const obj={}; rows.results.forEach(r=>obj[r.key]=r.value); return Response.json(obj);
}
