/* ============================================
   GRID DYNAMICS — Navegación, sesión y utilidades
   v2: Top Nav (sin sidebar), Lucide Icons,
       user dropdown, fetchOrMock helper
   ============================================ */

// ---- Sesión ----
const SESSION_KEY = 'gd_token';
const USER_KEY    = 'gd_user';

function setSession(token, user) {
  sessionStorage.setItem(SESSION_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  _fillUserUI(user);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

function getToken() {
  return sessionStorage.getItem(SESSION_KEY);
}

function getUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)) || {}; }
  catch(_) { return {}; }
}

function requireAuth(redirectTo) {
  if (!isLoggedIn()) {
    window.location.href = redirectTo || '../pages/login.html';
  }
}

function _fillUserUI(user) {
  if (!user) return;
  document.querySelectorAll('[data-user-name]').forEach(el => {
    el.textContent = user.name || user.email || 'Usuario';
  });
  document.querySelectorAll('[data-user-role]').forEach(el => {
    const roles = { engineer: 'Ingeniero', admin: 'Administrador', user: 'Usuario' };
    el.textContent = roles[user.role] || user.role || 'Miembro';
  });
}

// ---- Helpers API ----
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errMsg = `Error ${res.status}`;
    try {
      const data = await res.json();
      errMsg = data.detail || data.message || errMsg;
    } catch(_) {}
    if (res.status === 401) {
      clearSession();
      window.location.href = '../pages/login.html';
    }
    throw new Error(errMsg);
  }
  if (res.status === 204) return null;
  return res.json();
}

function apiGet(url)         { return apiFetch(url, { method: 'GET' }); }
function apiPost(url, body)  { return apiFetch(url, { method: 'POST',   body: JSON.stringify(body) }); }
function apiPut(url, body)   { return apiFetch(url, { method: 'PUT',    body: JSON.stringify(body) }); }
function apiPatch(url, body) { return apiFetch(url, { method: 'PATCH',  body: JSON.stringify(body) }); }
function apiDelete(url)      { return apiFetch(url, { method: 'DELETE' }); }

// ---- Formateo ----
function formatNumber(n, decimals = 0) {
  return Number(n).toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- SVG inline para iconos Lucide (toasts y loading) ----
const _svg = {
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  xCircle:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:        `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  alertTriangle:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  loader:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 0.8s linear infinite"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`,
  eye:         `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
};

// Spin keyframe
(function(){
  if (document.getElementById('gd-spin-style')) return;
  const s = document.createElement('style');
  s.id = 'gd-spin-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
})();

// ---- Toast ----
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const iconMap = {
    success: _svg.checkCircle,
    error:   _svg.xCircle,
    info:    _svg.info,
    warn:    _svg.alertTriangle
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${iconMap[type] || _svg.info}<span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Button loading ----
function setButtonLoading(btn, loading, loadingText = 'Cargando...') {
  if (!btn) return;
  if (loading) {
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML = `${_svg.loader} ${loadingText}`;
    btn.disabled = true;
  } else {
    if (btn._originalHTML) btn.innerHTML = btn._originalHTML;
    btn.disabled = false;
  }
}

// ---- Top Nav: mobile toggle + active link + user chip ----
document.addEventListener('DOMContentLoaded', () => {

  // Active nav link
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('.topnav-link[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === current || href.endsWith('/' + current))) {
      link.classList.add('active');
    }
  });

  // Rellena UI con usuario
  _fillUserUI(getUser());

  // Mobile nav drawer toggle
  const navToggle = document.getElementById('nav-toggle');
  const navDrawer = document.getElementById('nav-drawer');
  if (navToggle && navDrawer) {
    navToggle.addEventListener('click', () => {
      const isOpen = navDrawer.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Cerrar al hacer clic en un link del drawer
    navDrawer.querySelectorAll('.topnav-link').forEach(link => {
      link.addEventListener('click', () => {
        navDrawer.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // User chip dropdown
  const userChip = document.getElementById('user-chip');
  if (userChip) {
    userChip.addEventListener('click', (e) => {
      e.stopPropagation();
      userChip.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      userChip.classList.remove('open');
    });
    userChip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        userChip.classList.toggle('open');
      }
      if (e.key === 'Escape') userChip.classList.remove('open');
    });
  }

  // Logout en cualquier botón [data-action="logout"]
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try { await apiPost(ENDPOINTS.logout, {}); } catch(_) {}
      clearSession();
      window.location.href = '../index.html';
    });
  });

  // Toggle password visibility (auth pages)
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.togglePassword);
      if (!target) return;
      const show = target.type === 'password';
      target.type = show ? 'text' : 'password';
      btn.innerHTML = show ? _svg.eyeOff : _svg.eye;
    });
  });
});