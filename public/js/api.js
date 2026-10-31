
// api.js - helper fetch ke /api/*
// Semua request backend lewat sini agar mudah ganti auth
export async function api(path, opts={}){
  const token = localStorage.getItem('ryanx_token');
  opts.headers = {...(opts.headers||{}), 'Content-Type':'application/json'};
  if(token) opts.headers['Authorization']='Bearer '+token;
  const res = await fetch('/api'+path, opts);
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||'API Error');
  return data;
}
export function saveSession(token,user){localStorage.setItem('ryanx_token',token);localStorage.setItem('ryanx_user',JSON.stringify(user))}
export function getUser(){try{return JSON.parse(localStorage.getItem('ryanx_user')||'null')}catch{return null}}
export function logout(){localStorage.clear();location.href='/index.html'}
