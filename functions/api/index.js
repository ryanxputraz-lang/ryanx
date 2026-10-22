export async function onRequestGet({env}){
  const posts=await env.DB.prepare('SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id=users.id ORDER BY created_at DESC LIMIT 50').all();
  return Response.json(posts.results);
}
export async function onRequestPost({request, env}){
  const token=request.headers.get('Authorization'); if(!token) return Response.json({error:'Login dulu'},{status:401});
  let user; try{ user=JSON.parse(atob(token)); }catch{ return Response.json({error:'Token invalid'},{status:401}); }
  const {content,trade_pair,trade_type,profit}=await request.json();
  const id='p_'+Date.now();
  await env.DB.prepare('INSERT INTO posts (id,user_id,content,trade_pair,trade_type,profit,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,user.id,content,trade_pair,trade_type,profit,Date.now()).run();
  return Response.json({success:true});
}