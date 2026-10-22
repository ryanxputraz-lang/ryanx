export async function onRequestGet({env}){
  const posts = await env.DB1.prepare(`
    SELECT p.*, u.username, u.avatar, u.role FROM posts p 
    JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC LIMIT 50
  `).all();
  return Response.json(posts.results);
}
export async function onRequestPost({request, env}){
  const auth = request.headers.get("Authorization");
  if(!auth) return Response.json({error:"Login dulu"}, {status:401});
  const payload = JSON.parse(atob(auth.replace("Bearer ","")));
  const {content, image_url} = await request.json();
  if(!content) return Response.json({error:"Tulis sesuatu"}, {status:400});
  const res = await env.DB1.prepare("INSERT INTO posts (user_id, content, image_url) VALUES (?,?,?)")
    .bind(payload.id, content, image_url||'').run();
  return Response.json({id:res.meta.last_row_id});
}