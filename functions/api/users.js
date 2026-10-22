export async function onRequestGet({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const users = await db.prepare("SELECT id, username, email, role, created_at FROM users ORDER BY id DESC").all();
  return Response.json(users.results);
}

export async function onRequestPost({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const { username, email, password, role } = await request.json();
  if(!username || !password) return Response.json({error:'Username & password wajib'},{status:400});
  try{
    await db.prepare("INSERT INTO users (username, email, password, role) VALUES (?,?,?,?)")
      .bind(username, email, password, role || 'user').run();
    return Response.json({success:true});
  }catch(e){ return Response.json({error:e.message},{status:500}); }
}

export async function onRequestPut({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const { id, username, email, password, role } = await request.json();
  try{
    if(password){
      await db.prepare("UPDATE users SET username=?, email=?, password=?, role=? WHERE id=?").bind(username, email, password, role, id).run();
    } else {
      await db.prepare("UPDATE users SET username=?, email=?, role=? WHERE id=?").bind(username, email, role, id).run();
    }
    return Response.json({success:true});
  }catch(e){ return Response.json({error:e.message},{status:500}); }
}

export async function onRequestDelete({ request, env }) {
  const db = env['ryanx-db'] || env.ryanx_db || env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const token = request.headers.get('Authorization')?.replace('Bearer ','') || '';
  if(token){
    const myId = atob(token).split(':')[0];
    if(String(myId)===String(id)) return Response.json({error:'Tidak bisa hapus akun sendiri'},{status:400});
  }
  await db.prepare("DELETE FROM users WHERE id=?").bind(id).run();
  return Response.json({success:true});
}