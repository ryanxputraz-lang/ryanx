
const $ = (s) => document.querySelector(s);
async function handleLogin(e){
  e.preventDefault();
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const msg = $('#msg');
  if(msg){ msg.className='alert'; msg.style.display='none'; }
  try{
    const res = await fetch('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password})});
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Login gagal');
    if(msg){ msg.textContent='Login berhasil...'; msg.className='alert success'; msg.style.display='block'; }
    localStorage.setItem('ryanx_user', JSON.stringify(data.user));
    setTimeout(()=> location.href = data.user.role==='admin' ? '/admin.html' : '/dashboard.html', 600);
  }catch(err){ if(msg){ msg.textContent=err.message; msg.className='alert error'; msg.style.display='block'; } }
}
async function handleRegister(e){
  e.preventDefault();
  const username = $('#username').value.trim();
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const role = $('#role')?.value || 'user';
  const msg = $('#msg');
  try{
    const res = await fetch('/api/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,email,password,role})});
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Register gagal');
    msg.textContent='Akun dibuat!'; msg.className='alert success'; msg.style.display='block';
    setTimeout(()=> location.href='/index.html', 800);
  }catch(err){ msg.textContent=err.message; msg.className='alert error'; msg.style.display='block'; }
}
async function loadAdmin(){
  const tbody = document.getElementById('usersBody');
  if(!tbody) return;
  try{
    const res = await fetch('/api/me');
    const me = await res.json();
    if(!res.ok || me.role !== 'admin'){ location.href='/index.html'; return; }
    document.getElementById('adminName').textContent = me.username;
    const usersRes = await fetch('/api/users');
    const users = await usersRes.json();
    const countEl = document.getElementById('count');
    if(countEl) countEl.textContent = users.length + ' user';
    tbody.innerHTML = users.map(u=> `
      <tr>
        <td>${u.id}</td>
        <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis">${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
        <td class="actions">
          <button class="small secondary" onclick="openEdit(${u.id}, '${u.username.replace(/'/g,"\'")}', '${u.email}', '${u.role}')">Edit</button>
          <button class="small danger" onclick="deleteUser(${u.id}, '${u.username.replace(/'/g,"\'")}')">Hapus</button>
        </td>
      </tr>
    `).join('');
  }catch(e){ location.href='/index.html'; }
}
function openEdit(id, username, email, role){
  document.getElementById('editId').value = id;
  document.getElementById('editUsername').value = username;
  document.getElementById('editEmail').value = email;
  document.getElementById('editPassword').value = '';
  document.getElementById('editRole').value = role;
  const m = document.getElementById('editMsg'); if(m) m.style.display='none';
  document.getElementById('editModal').classList.add('open');
}
function closeModal(){ document.getElementById('editModal').classList.remove('open'); }
async function saveEdit(){
  const id = document.getElementById('editId').value;
  const username = document.getElementById('editUsername').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const password = document.getElementById('editPassword').value;
  const role = document.getElementById('editRole').value;
  const msg = document.getElementById('editMsg');
  msg.style.display='none';
  if(!username || !email) { msg.textContent='Username & email wajib'; msg.className='alert error'; msg.style.display='block'; return; }
  try{
    const body = { username, email, role };
    if(password) body.password = password;
    const res = await fetch(`/api/users/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Gagal update');
    closeModal(); loadAdmin();
  }catch(err){ msg.textContent=err.message; msg.className='alert error'; msg.style.display='block'; }
}
async function deleteUser(id, name){
  if(!confirm(`Hapus user "${name}" (ID:${id})?`)) return;
  try{
    const res = await fetch(`/api/users/${id}`, {method:'DELETE'});
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Gagal hapus');
    loadAdmin();
  }catch(err){ alert(err.message); }
}
async function logout(){ await fetch('/api/logout', {method:'POST'}); localStorage.removeItem('ryanx_user'); location.href='/index.html'; }
