
import {verifyToken} from '../utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {room_id,x,y}=await request.json();
  await env.DB.prepare("UPDATE lobby_presence SET x=?, y=?, last_seen=?, status='online' WHERE user_id=?").bind(x,y,Math.floor(Date.now()/1000),auth.id).run();
  return Response.json({ok:true});
}
