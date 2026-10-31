
import {verifyToken} from '../../utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  await env.DB.prepare("UPDATE users SET last_snake_game=? WHERE id=?").bind(Math.floor(Date.now()/1000), auth.id).run();
  return Response.json({ok:true});
}
