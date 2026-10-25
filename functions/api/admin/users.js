
export async function onRequestPost({ request, env }){
 const { username } = await request.json();
 const admin = await env.DB.prepare('SELECT * FROM users WHERE username=? AND is_admin=1').bind(username).first();
 if(!admin) return Response.json({ok:false,message:'Akses ditolak'});
 const { results } = await env.DB.prepare('SELECT username,chips,is_admin FROM users ORDER BY id DESC').all();
 return Response.json({ok:true,users:results});
}
