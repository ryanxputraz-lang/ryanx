export async function onRequestPost({request, env}){
  const token=request.headers.get('Authorization'); const user=JSON.parse(atob(token));
  const {post_id}=await request.json();
  const id='l_'+Date.now();
  try{ await env.DB.prepare('INSERT INTO likes (id,post_id,user_id) VALUES (?,?,?)').bind(id,post_id,user.id).run();
  await env.DB.prepare('UPDATE posts SET likes=likes+1 WHERE id=?').bind(post_id).run(); }catch{}
  return Response.json({success:true});
}