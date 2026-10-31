
import {verifyToken} from '../_middleware.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {room_id, x, y} = await request.json();
  const now = Math.floor(Date.now()/1000);
  await env.DB.prepare("INSERT OR REPLACE INTO lobby_presence(user_id,room_id,x,y,status,last_seen) VALUES(?,?,?,?,?,?)").bind(auth.id,room_id,x||100,y||100,'online',now).run();
  return Response.json({ok:true});
}
