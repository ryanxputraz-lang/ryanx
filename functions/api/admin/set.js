
export async function onRequestPost({ request, env }){
 const { admin, target, chips } = await request.json();
 const a = await env.DB.prepare('SELECT * FROM users WHERE username=? AND is_admin=1').bind(admin).first();
 if(!a) return Response.json({ok:false,message:'Bukan admin'});
 if(chips<0) return Response.json({ok:false,message:'Min 0'});
 await env.DB.prepare('UPDATE users SET chips=? WHERE username=?').bind(chips, target).run();
 return Response.json({ok:true,message:`Set chip ${target} = ${chips}`});
}
