export async function onRequestPost({request, env}){
  const token=request.headers.get('Authorization'); const user=JSON.parse(atob(token));
  const {post_id,content}=await request.json();
  const id='c_'+Date.now();
  await env.DB.prepare('INSERT INTO comments (id,post_id,user_id,content,created_at) VALUES (?,?,?,?,?)').bind(id,post_id,user.id,content,Date.now()).run();
  return Response.json({success:true});
}