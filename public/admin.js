async function loadUsers(){
  const res = await fetch('/api/admin/users');
  if (!res.ok) { alert('Failed to load users'); return; }
  const users = await res.json();
  const tbody = document.querySelector('#users-table tbody');
  tbody.innerHTML = '';
  for (const u of users){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.role)}</td>
      <td>
        ${u.role !== 'admin' ? `<button data-id="${u._id}" data-role="admin" class="promote">Make admin</button>` : `<button data-id="${u._id}" data-role="user" class="demote">Revoke admin</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function changeRole(id, role){
  const res = await fetch('/api/admin/users/'+id+'/role', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ role }) });
  if (!res.ok) { const j = await res.json().catch(()=>null); alert('Change role failed: ' + (j && j.error ? j.error : res.status)); return; }
  await loadUsers();
}

document.addEventListener('click', (e)=>{
  if (e.target.matches('.promote') || e.target.matches('.demote')){
    const id = e.target.dataset.id; const role = e.target.dataset.role;
    changeRole(id, role);
  }
});

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

loadUsers();
