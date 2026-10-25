
export async function onRequestPost({ request, env }){
 const { username, password } = await request.json();
 const row = await env.DB.prepare('SELECT * FROM users WHERE username=?').bind(username).first();
 if(!row || atob(row.password_hash)!==password) return Response.json({ok:false,message:'Login gagal'});
 return Response.json({ok:true,message:'Login ok', user:{username:row.username,chips:row.chips,is_admin:!!row.is_admin}});
}
