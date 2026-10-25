
import { hashPassword, signJwt, getJwtSecret } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { username, email, password, display_name } = await request.json();
    if(!username || !email || !password || !display_name) return Response.json({error:'Lengkapi semua field'}, {status:400});
    if(username.length < 3) return Response.json({error:'Username minimal 3'}, {status:400});

    const id = crypto.randomUUID();
    const pwHash = await hashPassword(password);
    const now = Date.now();

    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(display_name)}`;

    await env.DB.prepare('INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, created_at) VALUES (?,?,?,?,?,?,?)')
      .bind(id, username.toLowerCase(), email.toLowerCase(), pwHash, display_name, avatar, now).run();

    const token = await signJwt({id, username: username.toLowerCase(), role:'user'}, getJwtSecret(env));
    return Response.json({token, user:{id, username, display_name, role:'user', avatar_url:avatar}});
  } catch(e) {
    if(e.message.includes('UNIQUE')) return Response.json({error:'Username/email sudah dipakai'}, {status:409});
    return Response.json({error:e.message}, {status:500});
  }
}
