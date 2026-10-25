
export function getJwtSecret(env) {
  return env.JWT_SECRET || 'ryanx-dev-secret-change-me';
}

export async function hashPassword(password) {
  const salt = 'ryanx-salt-v1';
  const data = new TextEncoder().encode(salt + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function b64url(str) {
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}

export async function signJwt(payload, secret) {
  const header = b64urlJson({alg:'HS256', typ:'JWT'});
  const body = b64urlJson({...payload, exp: Math.floor(Date.now()/1000)+60*60*24*7});
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = b64url(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

export async function verifyJwt(token, secret) {
  try {
    const [h,b,s] = token.split('.');
    if(!h||!b||!s) return null;
    const data = `${h}.${b}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['verify']);
    const sig = Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
    if(!ok) return null;
    const payload = JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/')));
    if(payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  } catch { return null; }
}

export async function getUserFromRequest(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ','');
  if(!token) return null;
  const payload = await verifyJwt(token, getJwtSecret(env));
  if(!payload) return null;
  const user = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(payload.id).first();
  return user;
}
