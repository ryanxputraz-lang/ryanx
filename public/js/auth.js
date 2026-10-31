
// auth.js - logic login/register/index switching
import {api, saveSession, getUser, logout} from './api.js';
window.RX = {api, getUser, logout};

async function handleAuth(){
  const path = location.pathname;
  // Index logic: jika sudah login ubah jadi dashboard
  if(path.endsWith('/')||path.endsWith('index.html')){
    const user = getUser();
    if(user){
      // fetch fresh user data
      try{
        const fresh = await api('/me');
        document.getElementById('guest-view').style.display='none';
        document.getElementById('dash-view').style.display='block';
        document.getElementById('user-xpoin').innerText = fresh.xpoin;
        document.getElementById('user-name').innerText = fresh.username;
        // update local
        localStorage.setItem('ryanx_user', JSON.stringify(fresh));
      }catch(e){
        // token invalid
        logout();
      }
    }
  }
}
document.addEventListener('DOMContentLoaded', handleAuth);

// login form
window.doLogin = async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    const res = await api('/login',{method:'POST', body: JSON.stringify({email:fd.get('email'), password:fd.get('password')})});
    saveSession(res.token, res.user);
    location.href='/index.html';
  }catch(err){alert(err.message)}
}
window.doRegister = async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    const res = await api('/register',{method:'POST', body: JSON.stringify({username:fd.get('username'), email:fd.get('email'), password:fd.get('password')})});
    saveSession(res.token, res.user);
    location.href='/index.html';
  }catch(err){alert(err.message)}
}
