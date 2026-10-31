
import {verifyToken} from '../../utils.js';
export async function onRequestPost({request, env}){
  const auth = await verifyToken(request, env); if(!auth||auth.role!=='admin') return Response.json({error:'Admin only'},{status:403});
  const {id,category,name,price,rarity,description}=await request.json();
  await env.DB.prepare("INSERT OR REPLACE INTO shop_items(id,category,name,price,rarity,description) VALUES(?,?,?,?,?,?)").bind(id,category,name,parseInt(price),rarity,description).run();
  return Response.json({ok:true});
}
