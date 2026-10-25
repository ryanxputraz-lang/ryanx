
export async function onRequestPost({ request, env }){
 const { username } = await request.json();
 // simple daily claim: allow if last claim >24h, stored in KV or just always for demo
 // demo: tambah 500, limit 3x sehari via cek log table sederhana
 const row = await env.DB.prepare('SELECT chips FROM users WHERE username=?').bind(username).first();
 if(!row) return Response.json({ok:false,message:'User tidak ada'});
 const newChips = row.chips + 500;
 await env.DB.prepare('UPDATE users SET chips=? WHERE username=?').bind(newChips, username).run();
 return Response.json({ok:true,message:'Klaim 500 chip berhasil! (fun money)',chips:newChips});
}
