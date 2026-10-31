
export async function verifyToken(request, env){
  const auth = request.headers.get('Authorization');
  if(!auth) return null;
  const token = auth.replace('Bearer ','');
  try{
    const [b64] = token.split('.');
    const payload = JSON.parse(atob(b64));
    if(payload.exp < Date.now()/1000) return null;
    return payload;
  }catch{return null}
}
export function makeToken(p){p.exp=Math.floor(Date.now()/1000)+604800;return btoa(JSON.stringify(p))+'.sig';}
export async function hashPass(p){const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
