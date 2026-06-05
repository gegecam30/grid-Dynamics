/* ============================================
   GRID DYNAMICS — Autenticación
   POST /api/auth/login
   POST /api/auth/register
   ============================================ */

// ---- MODO DESARROLLO (sin backend real) ----
// Cambiar a false cuando el backend esté listo
const DEV_MODE = true;

const DEV_USER = {
  id: 'dev-001',
  name: 'Desarrollador',
  email: 'dev@griddynamics.app',
  role: 'engineer'
};

// Inline SVGs para field errors (Lucide compatible)
const _warnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

// ---- LOGIN ----
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    const btn = loginForm.querySelector('[type="submit"]');
    const email    = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!validateEmail(email)) {
      showFieldError('email', 'Ingresa un correo electrónico válido');
      return;
    }
    if (password.length < 6) {
      showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setButtonLoading(btn, true, 'Autenticando...');

    try {
      let token, user;

      if (DEV_MODE) {
        // Simula respuesta del backend en desarrollo
        await new Promise(r => setTimeout(r, 800));
        token = 'dev-token-' + Date.now();
        user  = { ...DEV_USER, email };
      } else {
        const data = await apiPost(ENDPOINTS.login, { email, password });
        token = data.access_token;
        user  = data.user;
      }

      setSession(token, user);
      showToast('Bienvenido de vuelta, ' + (user.name || user.email), 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (err) {
      showToast(err.message || 'Credenciales incorrectas', 'error');
      setButtonLoading(btn, false);
    }
  });
}

// ---- REGISTER ----
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    const btn     = registerForm.querySelector('[type="submit"]');
    const name    = registerForm.full_name?.value.trim();
    const email   = registerForm.email.value.trim();
    const password = registerForm.password.value;
    const confirm  = registerForm.confirm_password?.value;
    const role     = registerForm.querySelector('input[name="role"]:checked')?.value || 'engineer';
    const terms    = registerForm.querySelector('#terms')?.checked;

    let valid = true;
    if (!name || name.length < 3)   { showFieldError('full_name', 'Ingresa tu nombre completo (mínimo 3 caracteres)'); valid = false; }
    if (!validateEmail(email))       { showFieldError('email', 'Correo electrónico inválido'); valid = false; }
    if (password.length < 6)         { showFieldError('password', 'Mínimo 6 caracteres'); valid = false; }
    if (confirm && password !== confirm) { showFieldError('confirm_password', 'Las contraseñas no coinciden'); valid = false; }
    if (!terms) { showToast('Debes aceptar los términos y condiciones', 'warn'); valid = false; }
    if (!valid) return;

    setButtonLoading(btn, true, 'Creando cuenta...');

    try {
      let token, user;

      if (DEV_MODE) {
        await new Promise(r => setTimeout(r, 900));
        token = 'dev-token-' + Date.now();
        user  = { id: 'dev-' + Date.now(), name, email, role };
      } else {
        const data = await apiPost(ENDPOINTS.register, { name, email, password, role });
        token = data.access_token;
        user  = data.user;
      }

      setSession(token, user);
      showToast('Cuenta creada correctamente. ¡Bienvenido!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (err) {
      showToast(err.message || 'Error al crear la cuenta', 'error');
      setButtonLoading(btn, false);
    }
  });
}

// ---- Helpers ----
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function showFieldError(fieldName, msg) {
  const el = document.getElementById(`${fieldName}-error`);
  if (el) el.innerHTML = `${_warnSvg} ${msg}`;
}
function clearFieldErrors() {
  document.querySelectorAll('[id$="-error"]').forEach(el => el.innerHTML = '');
}