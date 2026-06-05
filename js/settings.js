/* ============================================
   GRID DYNAMICS — Settings JS
   Gestión de perfil, contraseña, notificaciones
   y preferencias del usuario.
   ============================================ */

'use strict';

const PREFS_KEY = 'gd_prefs';

/* ============================================================
   INIT
   ============================================================ */
function initSettings() {
  fillProfileForm();
  bindProfileForm();
  bindPasswordForm();
  bindPasswordToggles();
  loadAndBindToggles();
  loadAndBindPreferences();
  bindDangerZone();
}

/* ============================================================
   LLENAR FORMULARIO DE PERFIL CON DATOS DEL USUARIO
   ============================================================ */
function fillProfileForm() {
  const user = getUser();
  if (!user) return;

  // Nombre
  const nameInput = document.getElementById('name-input');
  if (nameInput) nameInput.value = user.name || '';

  // Email (deshabilitado)
  const emailInput = document.getElementById('email-input');
  if (emailInput) emailInput.value = user.email || '';

  // Rol (badge)
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) {
    const roles = {
      engineer:  'Ingeniero',
      admin:     'Administrador',
      user:      'Usuario',
      analyst:   'Analista',
      viewer:    'Observador'
    };
    roleDisplay.textContent = roles[user.role] || user.role || 'Miembro';
  }

  // Nombre en el avatar
  const avatarName = document.getElementById('avatar-display-name');
  if (avatarName) avatarName.textContent = user.name || user.email || 'Usuario';
}

/* ============================================================
   GUARDAR PERFIL
   ============================================================ */
function bindProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('save-profile-btn');
    const name = document.getElementById('name-input')?.value.trim();

    if (!name || name.length < 3) {
      showToast('El nombre debe tener al menos 3 caracteres.', 'warn');
      return;
    }

    setButtonLoading(btn, true, 'Guardando...');

    try {
      // Intenta PUT /api/auth/me, cae a mock si falla
      const user = getUser();
      await fetchOrMock(`${API_BASE}/api/auth/me`, { ...user, name });

      // Actualizar sesión local
      const updatedUser = { ...user, name };
      sessionStorage.setItem('gd_user', JSON.stringify(updatedUser));

      // Actualizar UI
      document.querySelectorAll('[data-user-name]').forEach(el => {
        el.textContent = name;
      });
      const avatarName = document.getElementById('avatar-display-name');
      if (avatarName) avatarName.textContent = name;

      showToast('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      showToast('Error al guardar los cambios. Inténtalo de nuevo.', 'error');
      console.error(err);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

/* ============================================================
   CAMBIAR CONTRASEÑA
   ============================================================ */
function bindPasswordForm() {
  const form = document.getElementById('password-form');
  if (!form) return;

  // Actualizar indicador de fuerza al escribir
  const newPwdInput = document.getElementById('new-password');
  if (newPwdInput) {
    newPwdInput.addEventListener('input', () => {
      updateStrengthMeter(newPwdInput.value);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn     = document.getElementById('save-password-btn');
    const current = document.getElementById('current-password')?.value;
    const newPwd  = document.getElementById('new-password')?.value;
    const confirm = document.getElementById('confirm-password')?.value;

    // Validaciones
    if (!current || current.length < 1) {
      showToast('Ingresa tu contraseña actual.', 'warn');
      return;
    }
    if (!newPwd || newPwd.length < 6) {
      showToast('La nueva contraseña debe tener al menos 6 caracteres.', 'warn');
      return;
    }
    if (newPwd !== confirm) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }
    if (current === newPwd) {
      showToast('La nueva contraseña debe ser diferente a la actual.', 'warn');
      return;
    }

    const strength = getPasswordStrength(newPwd);
    if (strength.level === 'weak') {
      showToast('La contraseña es demasiado débil. Usa al menos 6 caracteres.', 'warn');
      return;
    }

    setButtonLoading(btn, true, 'Actualizando...');

    try {
      await fetchOrMock(`${API_BASE}/api/auth/change-password`, { success: true });
      showToast('Contraseña actualizada correctamente.', 'success');

      // Limpiar campos
      form.reset();
      updateStrengthMeter('');
    } catch (err) {
      showToast('Error al cambiar la contraseña. Verifica tu contraseña actual.', 'error');
      console.error(err);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

/* ============================================================
   INDICADOR DE FUERZA DE CONTRASEÑA
   Débil: < 6 chars
   Regular: 6–8 chars
   Fuerte: > 8 chars + mayúscula + número
   ============================================================ */
function getPasswordStrength(pwd) {
  if (!pwd || pwd.length < 6) {
    return { level: 'weak', label: 'Débil', pct: 25, color: '#ff3250' };
  }
  const hasUpper  = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

  if (pwd.length >= 8 && hasUpper && hasNumber) {
    const isStrong = pwd.length >= 10 || hasSymbol;
    return isStrong
      ? { level: 'strong', label: 'Muy fuerte', pct: 100, color: 'var(--cyan)' }
      : { level: 'strong', label: 'Fuerte',     pct: 80,  color: 'var(--cyan)' };
  }
  if (pwd.length >= 6) {
    return { level: 'fair', label: 'Regular', pct: 50, color: '#ffa000' };
  }
  return { level: 'weak', label: 'Débil', pct: 25, color: '#ff3250' };
}

function updateStrengthMeter(pwd) {
  const bar       = document.getElementById('strength-bar');
  const text      = document.getElementById('strength-text');
  if (!bar || !text) return;

  if (!pwd) {
    bar.style.width      = '0%';
    bar.style.background = 'var(--text3)';
    bar.style.boxShadow  = 'none';
    text.textContent     = '—';
    text.style.color     = 'var(--text3)';
    return;
  }

  const s = getPasswordStrength(pwd);
  bar.style.width      = `${s.pct}%`;
  bar.style.background = s.color;
  bar.style.boxShadow  = `0 0 8px ${s.color}60`;
  text.textContent     = s.label;
  text.style.color     = s.color;
}

/* ============================================================
   TOGGLES DE CONTRASEÑA (Ojo)
   ============================================================ */
function bindPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-toggle-password');
      const target   = document.getElementById(targetId);
      if (!target) return;

      const show  = target.type === 'password';
      target.type = show ? 'text' : 'password';

      // Cambiar ícono
      btn.innerHTML = show
        ? '<i data-lucide="eye-off"></i>'
        : '<i data-lucide="eye"></i>';
      if (window.lucide) lucide.createIcons();
    });
  });
}

/* ============================================================
   TOGGLES DE NOTIFICACIONES
   Persiste en localStorage
   ============================================================ */
function loadAndBindToggles() {
  const prefs = loadPrefs();

  document.querySelectorAll('[data-pref]').forEach(input => {
    if (input.type !== 'checkbox') return;
    const key = input.dataset.pref;

    // Cargar estado guardado (default: true para notificaciones)
    const saved = prefs[key];
    input.checked = saved !== undefined ? saved : true;

    // Guardar al cambiar
    input.addEventListener('change', () => {
      const currentPrefs = loadPrefs();
      currentPrefs[key]  = input.checked;
      savePrefs(currentPrefs);

      const label = input.closest('.toggle-row')?.querySelector('.toggle-title')?.textContent || 'Preferencia';
      showToast(
        `${label}: ${input.checked ? 'activado' : 'desactivado'}`,
        'info',
        2000
      );
    });
  });
}

/* ============================================================
   PREFERENCIAS (Zona horaria, Unidades, Moneda)
   ============================================================ */
function loadAndBindPreferences() {
  const prefs = loadPrefs();
  const form  = document.getElementById('prefs-form');
  if (!form) return;

  // Zona horaria
  const tzSelect = document.getElementById('pref-timezone');
  if (tzSelect && prefs.timezone) tzSelect.value = prefs.timezone;

  // Unidades (radio)
  const unitVal = prefs.units || 'kWh';
  const unitRadio = document.querySelector(`input[name="units"][value="${unitVal}"]`);
  if (unitRadio) unitRadio.checked = true;
  // Si no hay ninguno marcado, marcar kWh por defecto
  if (!document.querySelector('input[name="units"]:checked')) {
    const kwhRadio = document.getElementById('unit-kwh');
    if (kwhRadio) kwhRadio.checked = true;
  }

  // Moneda
  const currSelect = document.getElementById('pref-currency');
  if (currSelect && prefs.currency) currSelect.value = prefs.currency;

  // Guardar al submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPrefs = loadPrefs();

    const tz       = document.getElementById('pref-timezone')?.value;
    const units    = document.querySelector('input[name="units"]:checked')?.value;
    const currency = document.getElementById('pref-currency')?.value;

    if (tz)       currentPrefs.timezone = tz;
    if (units)    currentPrefs.units    = units;
    if (currency) currentPrefs.currency = currency;

    savePrefs(currentPrefs);
    showToast('Preferencias guardadas correctamente.', 'success');
  });
}

/* ============================================================
   DANGER ZONE
   ============================================================ */
function bindDangerZone() {
  // Cerrar sesión en todos los dispositivos
  const closeAllBtn = document.getElementById('close-all-sessions-btn');
  if (closeAllBtn) {
    closeAllBtn.addEventListener('click', async () => {
      setButtonLoading(closeAllBtn, true, 'Cerrando sesiones...');
      try {
        await fetchOrMock(ENDPOINTS.logout, { success: true });
      } catch (_) {}
      showToast('Sesión cerrada en todos los dispositivos.', 'info');
      setTimeout(() => {
        clearSession();
        window.location.href = '../index.html';
      }, 1200);
    });
  }

  // Abrir modal de eliminación de cuenta
  const deleteBtn = document.getElementById('delete-account-btn');
  const modal     = document.getElementById('confirm-modal');
  if (deleteBtn && modal) {
    deleteBtn.addEventListener('click', () => {
      openModal(modal);
    });
  }

  // Cerrar modal
  const closeBtn  = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  [closeBtn, cancelBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        closeModal(modal);
        resetConfirmInput();
      });
    }
  });
  // Cerrar al hacer clic en overlay
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
        resetConfirmInput();
      }
    });
    // Tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal(modal);
        resetConfirmInput();
      }
    });
  }

  // Habilitar botón de confirmar sólo cuando el texto es correcto
  const confirmInput = document.getElementById('confirm-delete-input');
  const confirmBtn   = document.getElementById('modal-confirm-btn');
  if (confirmInput && confirmBtn) {
    confirmInput.addEventListener('input', () => {
      confirmBtn.disabled = confirmInput.value.trim() !== 'ELIMINAR';
    });

    confirmBtn.addEventListener('click', async () => {
      if (confirmInput.value.trim() !== 'ELIMINAR') return;

      setButtonLoading(confirmBtn, true, 'Eliminando...');
      try {
        await fetchOrMock(`${API_BASE}/api/auth/me`, { success: true });
        showToast('Cuenta eliminada. Hasta pronto.', 'info');
        setTimeout(() => {
          clearSession();
          localStorage.clear();
          window.location.href = '../index.html';
        }, 1500);
      } catch (err) {
        showToast('Error al eliminar la cuenta. Contacta soporte.', 'error');
        setButtonLoading(confirmBtn, false);
      }
    });
  }
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Focus al primer campo del modal
  setTimeout(() => {
    const firstInput = modal.querySelector('input, button');
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function resetConfirmInput() {
  const confirmInput = document.getElementById('confirm-delete-input');
  const confirmBtn   = document.getElementById('modal-confirm-btn');
  if (confirmInput) confirmInput.value = '';
  if (confirmBtn)   confirmBtn.disabled = true;
}

/* ============================================================
   PREFS (localStorage helpers)
   ============================================================ */
function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch (_) {
    return {};
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (_) {}
}
