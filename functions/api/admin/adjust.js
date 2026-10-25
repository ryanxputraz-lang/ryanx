
export async function onRequestPost({ request, env }){
 const { admin, target, delta } = await request.json();
 const a = await env.DB.prepare('SELECT * FROM users WHERE username=? AND is_admin=1').bind(admin).first();
 if(!a) return Response.json({ok:false,message:'Bukan admin'});
 const u = await env.DB.prepare('SELECT chips FROM users WHERE username=?').bind(target).first();
 if(!u) return Response.json({ok:false,message:'Target tidak ada'});
 let newC = Math.max(0, u.chips + (parseInt(delta)||0));
 await env.DB.prepare('UPDATE users SET chips=? WHERE username=?').bind(newC, target).run();
 return Response.json({ok:true,message:`Chip ${target} jadi ${newC}`});
}
