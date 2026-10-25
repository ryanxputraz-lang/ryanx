
export async function onRequestPost({ request, env }){
 const { username, password } = await request.json();
 if(!username||!password) return Response.json({ok:false,message:'Lengkapi data'});
 if(username.length<3) return Response.json({ok:false,message:'Username min 3'});
 try{
   await env.DB.prepare('INSERT INTO users (username,password_hash,chips) VALUES (?,?,?)').bind(username, btoa(password), 1000).run();
   return Response.json({ok:true,message:'Register berhasil'});
 }catch(e){ return Response.json({ok:false,message:'Username sudah ada'}); }
}
