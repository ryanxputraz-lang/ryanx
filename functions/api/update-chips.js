
export async function onRequestPost({ request, env }){
 const { username, chips } = await request.json();
 if(chips<0) return Response.json({ok:false});
 await env.DB.prepare('UPDATE users SET chips=? WHERE username=?').bind(chips, username).run();
 return Response.json({ok:true});
}
