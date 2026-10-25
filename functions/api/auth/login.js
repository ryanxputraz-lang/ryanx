
import { hashPassword, signJwt, getJwtSecret } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, password } = await request.json();
  if(!username || !password) return Response.json({error:'Username & password wajib'}, {status:400});

  const pwHash = await hashPassword(password);
  const user = await env.DB.prepare('SELECT * FROM users WHERE (username=? OR email=?) AND password_hash=?')
    .bind(username.toLowerCase(), username.toLowerCase(), pwHash).first();

  if(!user) return Response.json({error:'Login gagal, cek kredensial'}, {status:401});

  const token = await signJwt({id:user.id, username:user.username, role:user.role}, getJwtSecret(env));
  return Response.json({token, user:{id:user.id, username:user.username, display_name:user.display_name, role:user.role, avatar_url:user.avatar_url, bio:user.bio}});
}
