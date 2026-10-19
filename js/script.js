const usersBody = document.getElementById('usersBody');
const countEl = document.getElementById('count');
const editModal = document.getElementById('editModal');

async function safeJson(res){
  const text = await res.text();
  if(!text) return {};
  try { return JSON.parse(text); } 
  catch(e){
    throw new Error('Server ngasih bukan JSON: ' + text.slice(0,200));
  }
}

async function loadUsers(){
  try{
    if(usersBody) usersBody.innerHTML = '<tr><td colspan=5>Loading...</td></tr>';
    const res = await fetch('/api/users');
    const data = await safeJson(res);
    if(!res.ok) throw new Error(data.error || 'Gagal load');
    const users = Array.isArray(data) ? data : data.users || [];
    if(countEl) countEl.textContent = users.length + ' user';
    if(!users.length){
      usersBody.innerHTML = '<tr><td colspan=5>Belum ada user</td></tr>';
      return;
    }
    usersBody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '19/10/2026'}</td>
        <td class="actions">
          <button class="small" onclick="openEdit(${u.id}, '${u.username}', '${u.email}', '${u.role}')">Edit</button>
          <button class="small danger" onclick="hapusUser(${u.id})">Hapus</button>
        </td>
      </tr>
    `).join('');
  }catch(e){
    if(usersBody) usersBody.innerHTML = `<tr><td colspan=5 style="color:red">${e.message}</td></tr>`;
  }
}

function openEdit(id, username, email, role){
  document.getElementById('editId').value = id;
  document.getElementById('editUsername').value = username;
  document.getElementById('editEmail').value = email;
  document.getElementById('editPassword').value = '';
  document.getElementById('editRole').value = role;
  editModal.classList.add('open');
}
function closeModal(){ editModal.classList.remove('open'); }

async function saveEdit(){
  const id = document.getElementById('editId').value;
  const payload = {
    username: document.getElementById('editUsername').value,
    email: document.getElementById('editEmail').value,
    password: document.getElementById('editPassword').value,
    role: document.getElementById('editRole').value
  };
  try{
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await safeJson(res);
    if(!res.ok) throw new Error(data.error || 'Gagal update');
    closeModal();
    loadUsers();
  }catch(e){ alert(e.message); }
}

async function hapusUser(id){
  if(!confirm('Hapus user ini?')) return;
  try{
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = await safeJson(res);
    if(!res.ok) throw new Error(data.error || 'Gagal hapus');
    loadUsers();
  }catch(e){ alert(e.message); }
}

loadUsers();
editModal?.addEventListener('click', (e)=>{ if(e.target === editModal) closeModal(); });