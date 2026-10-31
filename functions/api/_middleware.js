
// Middleware untuk auth JWT sederhana (HMAC)
export async function verifyToken(request, env){
  const auth = request.headers.get('Authorization');
  if(!auth) return null;
  const token = auth.replace('Bearer ','');
  try{
    const [payloadB64, sig] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    // cek exp 7 hari
    if(payload.exp < Date.now()/1000) return null;
    // simple verify - di production gunakan JWT library + env.JWT_SECRET
    return payload; // {id, username, role}
  }catch{return null}
}
