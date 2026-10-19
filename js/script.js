const $ = (s) => document.querySelector(s);
async function handleLogin(e){
  e.preventDefault();
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const msg = $('#msg');
  msg.className='alert'; msg.style.display='none';
  try{
    const res = await fetch('/api/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Login gagal');
    msg.textContent = 'Login berhasil, redirect...';
    msg.className='alert success';
    msg.style.display='block';
    localStorage.setItem('ryanx_user', JSON.stringify(data.user));
    setTimeout(()=> location.href = data.user.role === 'admin' ? '/admin.html' : '/dashboard.html', 800);
  }catch(err){
    msg.textContent = err.message;
    msg.className='alert error';
    msg.style.display='block';
  }
}
async function handleRegister(e){
  e.preventDefault();
  const username = $('#username').value.trim();
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const role = $('#role')?.value || 'user';
  const msg = $('#msg');
  try{
    const res = await fetch('/api/register', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username, email, password, role})
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Register gagal');
    msg.textContent = 'Akun dibuat! Silahkan login.';
    msg.className='alert success';
    msg.style.display='block';
    setTimeout(()=> location.href='/index.html', 1000);
  }catch(err){
    msg.textContent = err.message;
    msg.className='alert error';
    msg.style.display='block';
  }
}
async function loadAdmin(){
  const tbody = $('#usersBody');
  if(!tbody) return;
  try{
    const res = await fetch('/api/me');
    const me = await res.json();
    if(!res.ok || me.role !== 'admin'){
      location.href='/index.html';
      return;
    }
    $('#adminName').textContent = me.username;
    const usersRes = await fetch('/api/users');
    const users = await usersRes.json();
    tbody.innerHTML = users.map(u=> `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
  }catch(e){
    location.href='/index.html';
  }
}
async function logout(){
  await fetch('/api/logout', {method:'POST'});
  localStorage.removeItem('ryanx_user');
  location.href='/index.html';
}