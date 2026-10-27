/* ================================================================
   BUILDER PRO — App Logic
   https://ryanx.my.id
   ================================================================ */

/* ---------------- SCHEMA ---------------- */
const SCHEMA = {
  h1:     { attrs: ['id','class'], content: true,  label: 'Heading 1' },
  h2:     { attrs: ['id','class'], content: true,  label: 'Heading 2' },
  h3:     { attrs: ['id','class'], content: true,  label: 'Heading 3' },
  p:      { attrs: ['id','class'], content: true,  label: 'Paragraph' },
  span:   { attrs: ['id','class'], content: true,  label: 'Span' },
  a:      { attrs: ['id','class','href','target','rel'], content: true, label: 'Link' },
  img:    { attrs: ['id','class','src','alt','width','height'], content: false, label: 'Image', void: true },
  button: { attrs: ['id','class','type','onclick'], content: true, label: 'Button' },
  div:    { attrs: ['id','class','style'], content: false, label: 'Container', children: true },
  section:{ attrs: ['id','class'], content: false, label: 'Section', children: true },
  header: { attrs: ['id','class'], content: false, label: 'Header', children: true },
  footer: { attrs: ['id','class'], content: false, label: 'Footer', children: true },
  ul:     { attrs: ['id','class'], content: false, label: 'List', children: true },
  li:     { attrs: ['id','class'], content: true,  label: 'List Item' },
  form:   { attrs: ['id','class','action','method'], content: false, label: 'Form', children: true },
  input:  { attrs: ['id','class','type','name','placeholder','value','required'], content: false, label: 'Input', void: true },
  br:     { attrs: [], content: false, label: 'Line Break', void: true },
  hr:     { attrs: [], content: false, label: 'Horizontal Rule', void: true },
};

/* ---------------- STATE ---------------- */
let state = {
  lang: 'id',
  title: 'Halaman Baru',
  desc: '',
  css: '',
  js: '',
  elements: [],
  uidCounter: 1,
};
let history = [];
let historyIndex = -1;
let currentCodeTab = 'html';
let dragSrcUid = null;

/* ---------------- DOM CACHE ---------------- */
const $ = id => document.getElementById(id);
const elList = $('elementsList');
const elCount = $('elCount');
const addBar = $('addBar');
const codeView = $('codeView');
const previewFrame = $('previewFrame');
const toast = $('toast');

/* ---------------- HISTORY ---------------- */
function pushHistory() {
  const snap = JSON.stringify(state);
  if (history[historyIndex] === snap) return;
  history = history.slice(0, historyIndex + 1);
  history.push(snap);
  historyIndex = history.length - 1;
  if (history.length > 50) { history.shift(); historyIndex--; }
}
function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    state = JSON.parse(history[historyIndex]);
    renderAll();
    showToast('↶ Undo');
  }
}
function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    state = JSON.parse(history[historyIndex]);
    renderAll();
    showToast('↷ Redo');
  }
}

/* ---------------- ELEMENT OPERATIONS ---------------- */
function addElement(type, parentUid = null) {
  const schema = SCHEMA[type];
  const attrs = {};
  schema.attrs.forEach(a => attrs[a] = '');
  const newEl = {
    uid: state.uidCounter++,
    type,
    attrs,
    content: '',
    children: schema.children ? [] : undefined,
  };
  if (parentUid) {
    const parent = findEl(parentUid);
    if (parent && parent.children) parent.children.push(newEl);
  } else {
    state.elements.push(newEl);
  }
  pushHistory();
  renderAll();
}

function findEl(uid, list = state.elements) {
  for (const el of list) {
    if (el.uid === uid) return el;
    if (el.children) {
      const found = findEl(uid, el.children);
      if (found) return found;
    }
  }
  return null;
}

function removeElement(uid, list = state.elements) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].uid === uid) {
      list.splice(i, 1);
      pushHistory();
      renderAll();
      return true;
    }
    if (list[i].children) {
      if (removeElement(uid, list[i].children)) return true;
    }
  }
  return false;
}

function moveElement(fromUid, toUid) {
  const fromIdx = state.elements.findIndex(e => e.uid === fromUid);
  const toIdx = state.elements.findIndex(e => e.uid === toUid);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = state.elements.splice(fromIdx, 1);
  state.elements.splice(toIdx, 0, moved);
  pushHistory();
  renderAll();
}

/* ---------------- RENDER FORM ---------------- */
function renderForm() {
  elList.innerHTML = '';
  elCount.textContent = state.elements.length;

  if (state.elements.length === 0) {
    elList.innerHTML = `<div style="text-align:center;color:var(--text-dim);padding:20px;font-size:12px;">Belum ada elemen. Klik tombol di bawah untuk menambah.</div>`;
  }

  state.elements.forEach(el => {
    elList.appendChild(renderCard(el, false));
  });
}

function renderCard(el, isChild, parentUid = null) {
  const schema = SCHEMA[el.type];
  if (!schema) return document.createElement('div');
  const card = document.createElement('div');
  card.className = 'el-card';
  card.dataset.uid = el.uid;

  if (!isChild) {
    card.draggable = true;
    card.addEventListener('dragstart', e => {
      dragSrcUid = el.uid;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.el-card').forEach(c => c.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (dragSrcUid !== el.uid) card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrcUid && dragSrcUid !== el.uid) {
        moveElement(dragSrcUid, el.uid);
        dragSrcUid = null;
      }
    });
  }

  // Header
  const header = document.createElement('div');
  header.className = 'el-header';
  header.innerHTML = `
    ${!isChild ? '<span class="drag-handle">⋮⋮</span>' : ''}
    <span class="tag-badge">&lt;${el.type}&gt;</span>
    <div class="el-actions">
      ${schema.children ? `<button title="Tambah child" data-act="addchild">+</button>` : ''}
      <button class="del" title="Hapus" data-act="del">🗑</button>
    </div>
  `;
  header.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.act === 'del') removeElement(el.uid);
      if (btn.dataset.act === 'addchild') showChildAdder(el.uid);
    };
  });
  card.appendChild(header);

  // Attributes
  schema.attrs.forEach(attr => {
    const f = document.createElement('div');
    f.className = 'field';
    const lbl = document.createElement('label');
    lbl.textContent = attr;
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = el.attrs[attr] || '';
    inp.placeholder = (attr === 'href' || attr === 'src') ? 'https://...' : '';
    inp.oninput = e => {
      el.attrs[attr] = e.target.value;
      scheduleRender();
    };
    f.appendChild(lbl);
    f.appendChild(inp);
    card.appendChild(f);
  });

  // Content
  if (schema.content) {
    const f = document.createElement('div');
    f.className = 'field';
    const lbl = document.createElement('label');
    lbl.textContent = 'Teks / Konten';
    const ta = document.createElement('textarea');
    ta.rows = 2;
    ta.value = el.content || '';
    ta.placeholder = 'Isi teks...';
    ta.oninput = e => {
      el.content = e.target.value;
      scheduleRender();
    };
    f.appendChild(lbl);
    f.appendChild(ta);
    card.appendChild(f);
  }

  // Children
  if (schema.children && el.children) {
    el.children.forEach(child => {
      const childBox = document.createElement('div');
      childBox.className = 'child-box';
      childBox.appendChild(renderCard(child, true, el.uid));
      card.appendChild(childBox);
    });
  }

  return card;
}

function showChildAdder(parentUid) {
  const tags = Object.keys(SCHEMA).filter(t => !SCHEMA[t].children);
  showModal('Tambah Child',
    `<div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${tags.map(t => `<button class="add-bar-btn" data-type="${t}" style="padding:6px 12px;background:var(--bg-3);border:1px solid var(--border);border-radius:6px;font-family:var(--mono);font-size:12px;">&lt;${t}&gt;</button>`).join('')}
    </div>`,
    null
  );
  setTimeout(() => {
    document.querySelectorAll('.add-bar-btn').forEach(btn => {
      btn.onclick = () => {
        addElement(btn.dataset.type, parentUid);
        closeModal();
      };
    });
  }, 50);
}

function renderAddBar() {
  addBar.innerHTML = '';
  Object.keys(SCHEMA).forEach(type => {
    const btn = document.createElement('button');
    btn.textContent = '+ ' + type;
    btn.onclick = () => addElement(type);
    addBar.appendChild(btn);
  });
}

/* ---------------- BUILD HTML ---------------- */
function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeText(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildAttrs(attrs) {
  let out = '';
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v && String(v).trim() !== '') out += ` ${k}="${escapeAttr(v)}"`;
  });
  return out;
}

function buildElement(el, indent = '  ') {
  const schema = SCHEMA[el.type];
  if (!schema) return '';
  const attrs = buildAttrs(el.attrs);
  const content = el.content ? escapeText(el.content) : '';

  if (schema.void) return `${indent}<${el.type}${attrs}>`;

  if (schema.children) {
    let inner = '';
    (el.children || []).forEach(c => {
      inner += buildElement(c, indent + '  ') + '\n';
    });
    return `${indent}<${el.type}${attrs}>\n${inner}${indent}</${el.type}>`;
  }

  if (content) return `${indent}<${el.type}${attrs}>${content}</${el.type}>`;
  return `${indent}<${el.type}${attrs}></${el.type}>`;
}

function buildHTML() {
  let body = '';
  state.elements.forEach(el => {
    body += buildElement(el, '  ') + '\n';
  });

  const cssTag = state.css.trim()
    ? `  <style>\n${state.css.split('\n').map(l => '    ' + l).join('\n')}\n  </style>\n`
    : '';
  const jsTag = state.js.trim()
    ? `  <script>\n${state.js.split('\n').map(l => '    ' + l).join('\n')}\n  <\/script>\n`
    : '';

  return `<!DOCTYPE html>
<html lang="${escapeAttr(state.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeText(state.title)}</title>
  ${state.desc ? `<meta name="description" content="${escapeAttr(state.desc)}">\n  ` : ''}${cssTag}</head>
<body>
${body}${jsTag}</body>
</html>`;
}

/* ---------------- PREVIEW ---------------- */
function updatePreview() {
  previewFrame.srcdoc = buildHTML();
}

/* ---------------- CODE VIEW ---------------- */
function highlightHTML(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>')
    .replace(/([\w-]+)=/g, '<span class="hl-attr">$1</span>=')
    .replace(/(".*?")/g, '<span class="hl-str">$1</span>');
}
function highlightCSS(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(\/\*.*?\*\/)/g, '<span class="hl-comment">$1</span>')
    .replace(/([\w-]+)\s*:/g, '<span class="hl-attr">$1</span>:')
    .replace(/("[^"]*"|'[^']*')/g, '<span class="hl-str">$1</span>');
}

function updateCodeView() {
  if (currentCodeTab === 'html') {
    codeView.innerHTML = highlightHTML(buildHTML());
  } else if (currentCodeTab === 'css') {
    codeView.innerHTML = highlightCSS(state.css || '/* Belum ada CSS */');
  } else {
    codeView.innerHTML = `<span class="hl-comment">${escapeText(state.js || '// Belum ada JS')}</span>`;
  }
}

/* ---------------- RENDER ---------------- */
let renderTimer = null;
function scheduleRender() {
  if (renderTimer) cancelAnimationFrame(renderTimer);
  renderTimer = requestAnimationFrame(() => {
    updatePreview();
    updateCodeView();
    pushHistory();
  });
}

function renderAll() {
  renderForm();
  updatePreview();
  updateCodeView();
  $('inputLang').value = state.lang;
  $('inputTitle').value = state.title;
  $('inputDesc').value = state.desc;
  $('inputCSS').value = state.css;
  $('inputJS').value = state.js;
}

/* ---------------- TOAST ---------------- */
let toastTimer;
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ---------------- MODAL ---------------- */
function showModal(title, bodyHTML, footerHTML) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = bodyHTML;
  $('modalFooter').innerHTML = footerHTML || '';
  $('modal').classList.add('active');
}
function closeModal() { $('modal').classList.remove('active'); }

/* ---------------- TEMPLATES ---------------- */
const TEMPLATES = {
  landing: {
    name: '🚀 Landing Page',
    desc: 'Hero + CTA + footer',
    state: {
      lang: 'id', title: 'Landing Page', desc: 'Halaman landing sederhana',
      css: `body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
.hero { padding: 80px 20px; text-align: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
.hero h1 { font-size: 3rem; margin-bottom: 20px; }
.hero p { font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; }
.cta { display: inline-block; padding: 14px 32px; background: white; color: #667eea; border-radius: 30px; text-decoration: none; font-weight: bold; }
.container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
footer { text-align: center; padding: 20px; color: #888; border-top: 1px solid #eee; }`,
      js: `document.querySelector('.cta')?.addEventListener('click', e => {
  e.preventDefault();
  alert('Terima kasih!');
});`,
      elements: [
        { uid: 1, type: 'section', attrs: { class: 'hero' }, children: [
          { uid: 2, type: 'h1', attrs: {}, content: 'Selamat Datang' },
          { uid: 3, type: 'p', attrs: {}, content: 'Bangun website impianmu tanpa coding.' },
          { uid: 4, type: 'a', attrs: { href: '#', class: 'cta' }, content: 'Mulai Sekarang' },
        ]},
        { uid: 5, type: 'div', attrs: { class: 'container' }, children: [
          { uid: 6, type: 'h2', attrs: {}, content: 'Fitur Unggulan' },
          { uid: 7, type: 'p', attrs: {}, content: 'Builder ini dibuat dengan HTML, CSS, dan JS murni.' },
        ]},
        { uid: 8, type: 'footer', attrs: {}, children: [
          { uid: 9, type: 'p', attrs: {}, content: '© 2025 ryanx.my.id' },
        ]},
      ],
      uidCounter: 10,
    }
  },
  blog: {
    name: '📝 Blog Post',
    desc: 'Artikel dengan heading & paragraf',
    state: {
      lang: 'id', title: 'Artikel Blog', desc: '',
      css: `body { font-family: Georgia, serif; line-height: 1.8; max-width: 700px; margin: 0 auto; padding: 20px; color: #333; }
h1 { font-size: 2.5rem; margin-bottom: 10px; }
.meta { color: #888; font-size: 0.9rem; margin-bottom: 30px; }`,
      js: '',
      elements: [
        { uid: 1, type: 'h1', attrs: {}, content: 'Judul Artikel' },
        { uid: 2, type: 'p', attrs: { class: 'meta' }, content: 'Oleh Penulis · 27 Oktober 2025' },
        { uid: 3, type: 'p', attrs: {}, content: 'Ini adalah paragraf pembuka artikel.' },
        { uid: 4, type: 'h2', attrs: {}, content: 'Sub Judul' },
        { uid: 5, type: 'p', attrs: {}, content: 'Isi konten yang lebih detail di sini...' },
      ],
      uidCounter: 6,
    }
  },
  form: {
    name: '📋 Contact Form',
    desc: 'Form dengan input + tombol',
    state: {
      lang: 'id', title: 'Kontak', desc: '',
      css: `body { font-family: system-ui, sans-serif; max-width: 500px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
form { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
input { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
button { width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }`,
      js: `document.querySelector('form')?.addEventListener('submit', e => {
  e.preventDefault();
  alert('Pesan terkirim!');
});`,
      elements: [
        { uid: 1, type: 'h1', attrs: {}, content: 'Hubungi Kami' },
        { uid: 2, type: 'form', attrs: {}, children: [
          { uid: 3, type: 'input', attrs: { type: 'text', name: 'nama', placeholder: 'Nama lengkap' } },
          { uid: 4, type: 'input', attrs: { type: 'email', name: 'email', placeholder: 'Email' } },
          { uid: 5, type: 'button', attrs: { type: 'submit' }, content: 'Kirim' },
        ]},
      ],
      uidCounter: 6,
    }
  },
};

function loadTemplate(key) {
  const tpl = TEMPLATES[key];
  if (!tpl) return;
  state = JSON.parse(JSON.stringify(tpl.state));
  pushHistory();
  renderAll();
  showToast('✅ Template dimuat: ' + tpl.name);
  closeModal();
}

/* ---------------- EXPORT / IMPORT ---------------- */
function exportJSON() {
  const data = JSON.stringify(state, null, 2);
  showModal('📤 Export JSON',
    `<p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Simpan JSON ini untuk import kembali nanti.</p>
     <textarea id="exportArea" readonly>${data.replace(/</g, '&lt;')}</textarea>`,
    `<button class="cancel" onclick="closeModal()">Tutup</button>
     <button class="confirm" onclick="copyExport()">📋 Copy JSON</button>`
  );
}

function copyExport() {
  const ta = document.getElementById('exportArea');
  ta.select();
  document.execCommand('copy');
  showToast('✅ JSON ter-copy');
}

function importJSON() {
  showModal('📥 Import JSON',
    `<p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Paste JSON hasil export sebelumnya.</p>
     <textarea id="importArea" placeholder='{"lang":"id",...}'></textarea>`,
    `<button class="cancel" onclick="closeModal()">Batal</button>
     <button class="confirm" onclick="doImport()">Import</button>`
  );
}

function doImport() {
  try {
    const txt = document.getElementById('importArea').value;
    const data = JSON.parse(txt);
    if (!data || typeof data !== 'object') throw new Error('Invalid');
    state = { ...state, ...data };
    if (!state.uidCounter) state.uidCounter = 100;
    pushHistory();
    renderAll();
    closeModal();
    showToast('✅ Berhasil import');
  } catch (e) {
    showToast('❌ JSON tidak valid', 'error');
  }
}

function copyHTML() {
  const html = buildHTML();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(html).then(() => {
      showToast('✅ HTML ter-copy ke clipboard');
    }).catch(() => fallbackCopy(html));
  } else {
    fallbackCopy(html);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('✅ HTML ter-copy'); }
  catch { showToast('❌ Gagal copy', 'error'); }
  document.body.removeChild(ta);
}

/* ---------------- CLEAR ---------------- */
function clearAll() {
  showModal('🗑 Hapus semua?',
    `<p style="font-size:13px;">Semua elemen, CSS, dan JS akan dihapus. Yakin?</p>`,
    `<button class="cancel" onclick="closeModal()">Batal</button>
     <button class="confirm" style="background:var(--danger);" onclick="doClear()">Hapus</button>`
  );
}
function doClear() {
  state = {
    lang: 'id', title: 'Halaman Baru', desc: '', css: '', js: '',
    elements: [], uidCounter: 1,
  };
  pushHistory();
  renderAll();
  closeModal();
  showToast('🗑 Semua dihapus');
}

/* ---------------- INIT ---------------- */
function init() {
  // restore theme
  const saved = localStorage.getItem('bp-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    $('btnTheme').textContent = saved === 'light' ? '☀️' : '🌙';
  }

  // theme toggle
  $('btnTheme').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    $('btnTheme').textContent = next === 'light' ? '☀️' : '🌙';
    localStorage.setItem('bp-theme', next);
  };

  // tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $('panel-' + tab.dataset.tab).classList.add('active');
    };
  });

  // code tabs
  document.querySelectorAll('.code-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCodeTab = tab.dataset.code;
      updateCodeView();
    };
  });

  // global inputs
  $('inputLang').onchange = e => { state.lang = e.target.value; scheduleRender(); };
  $('inputTitle').oninput = e => { state.title = e.target.value; scheduleRender(); };
  $('inputDesc').oninput = e => { state.desc = e.target.value; scheduleRender(); };
  $('inputCSS').oninput = e => { state.css = e.target.value; scheduleRender(); };
  $('inputJS').oninput = e => { state.js = e.target.value; scheduleRender(); };

  // buttons
  $('btnUndo').onclick = undo;
  $('btnRedo').onclick = redo;
  $('btnExport').onclick = exportJSON;
  $('btnTemplate').onclick = () => {
    const list = Object.entries(TEMPLATES).map(([k, t]) =>
      `<div class="template-item" data-tpl="${k}">
        <h4>${t.name}</h4>
        <p>${t.desc}</p>
      </div>`
    ).join('');
    showModal('📚 Template Gallery', `<div class="template-list">${list}</div>`,
      `<button class="cancel" onclick="closeModal()">Tutup</button>`);
    document.querySelectorAll('.template-item').forEach(item => {
      item.onclick = () => loadTemplate(item.dataset.tpl);
    });
  };
  $('btnImport').onclick = importJSON;
  $('btnClear').onclick = clearAll;
  $('btnCopy').onclick = copyHTML;

  $('btnRefresh').onclick = () => { updatePreview(); showToast('🔄 Refresh'); };
  $('previewDevice').onchange = e => {
    previewFrame.style.width = e.target.value === '100%' ? '100%' : e.target.value + 'px';
    previewFrame.style.margin = e.target.value === '100%' ? '0' : '0 auto';
    previewFrame.style.display = 'block';
  };

  $('modalClose').onclick = closeModal;
  $('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };

  // keyboard shortcuts
  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    if (mod && e.key === 's') { e.preventDefault(); copyHTML(); }
    if (e.key === 'Escape') closeModal();
  });

  // render
  renderAddBar();
  pushHistory();
  renderAll();
  setTimeout(() => showToast('⚡ Builder siap! Klik + tag untuk mulai'), 500);
}

// Expose ke global untuk onclick di modal
window.closeModal = closeModal;
window.copyExport = copyExport;
window.doImport = doImport;
window.doClear = doClear;
window.loadTemplate = loadTemplate;

// Run
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
