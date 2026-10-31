
import {verifyToken} from '../utils.js';
// Simpan chat di xpoin_log tipe lobby_chat untuk simple
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const {room_id,msg}=await request.json();
  await env.DB.prepare("INSERT INTO xpoin_log(id,user_id,type,amount,note,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(), auth.id,'lobby_chat_'+room_id,0,msg,Math.floor(Date.now()/1000)).run();
  return Response.json({ok:true});
}
