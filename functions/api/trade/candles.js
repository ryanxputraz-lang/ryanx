
import {verifyToken} from '../utils.js';
export async function onRequestGet({request, env}){
  const auth = await verifyToken(request, env); if(!auth) return Response.json({error:'Unauthorized'},{status:401});
  const url=new URL(request.url); const tf=url.searchParams.get('tf')||'1m';
  // generate fake candle if kosong (untuk demo, anti inflasi pakai random walk)
  let rows = await env.DB.prepare("SELECT * FROM trade_candles WHERE timeframe=? ORDER BY timestamp DESC LIMIT 60").bind(tf).all();
  if(rows.results.length<5){
    // seed
    let price=1000, now=Math.floor(Date.now()/1000);
    for(let i=0;i<30;i++){const o=price; price+= (Math.random()-0.5)*10; const h=Math.max(o,price)+Math.random()*5; const l=Math.min(o,price)-Math.random()*5; await env.DB.prepare("INSERT INTO trade_candles(timeframe,open,high,low,close,timestamp) VALUES(?,?,?,?,?,?)").bind(tf,o,h,l,price,now-i*60).run()}
    rows = await env.DB.prepare("SELECT * FROM trade_candles WHERE timeframe=? ORDER BY timestamp DESC LIMIT 60").bind(tf).all();
  }
  const user = await env.DB.prepare("SELECT xpoin FROM users WHERE id=?").bind(auth.id).first();
  return Response.json({candles:rows.results.reverse(), xpoin:user.xpoin});
}
