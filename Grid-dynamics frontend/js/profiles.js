/* ============================================================
   GRID DYNAMICS — profiles.js
   Lógica de carga y validación de perfiles CSV de demanda.
   Cumple con el estándar de validación PU-008.
   ============================================================ */

/* ── Columnas requeridas (PU-008) ── */
const REQUIRED_COLUMNS = ['timestamp', 'consumption_kwh', 'peak_flag'];

/* ── Mensajes de error PU-008 por columna ── */
const PU008_ERRORS = {
  timestamp:       { code: 'ERR-PU-008-A', msg: 'La columna "timestamp" está ausente o tiene nombre incorrecto.' },
  consumption_kwh: { code: 'ERR-PU-008-B', msg: 'La columna "consumption_kwh" está ausente o renombrada (ej. "consumo", "kwh").' },
  peak_flag:       { code: 'ERR-PU-008-C', msg: 'La columna "peak_flag" está ausente o renombrada (ej. "pico", "flag").' }
};

/* ── Tamaño máximo permitido (10 MB) ── */
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/* ── Estado ── */
let currentFile  = null;
let parsedCSV    = null;   // { headers, rows }
let csvIsValid   = false;

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
function initProfiles() {
  bindDropZone();
  bindFileInput();
  bindSaveButton();
  bindFormatModal();
  bindRemoveFile();
  loadSavedProfiles();
}

/* ============================================================
   DRAG & DROP
   ============================================================ */
function bindDropZone() {
  const zone = document.getElementById('drop-zone');
  if (!zone) return;

  // Prevenir comportamiento por defecto del navegador
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
    zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); });
    document.body.addEventListener(ev, e => e.preventDefault());
  });

  // Hover visual
  zone.addEventListener('dragenter', () => zone.classList.add('drag-over'));
  zone.addEventListener('dragover',  () => zone.classList.add('drag-over'));
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  // Soltar archivo
  zone.addEventListener('drop', (e) => {
    zone.classList.remove('drag-over');
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  // Accesibilidad: activar con teclado
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('csv-file-input')?.click();
    }
  });
}

/* ── Input file change ── */
function bindFileInput() {
  const input = document.getElementById('csv-file-input');
  if (!input) return;
  input.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    // Limpiar para permitir reseleccionar el mismo archivo
    input.value = '';
  });
}

/* ── Quitar archivo ── */
function bindRemoveFile() {
  document.getElementById('remove-file-btn')?.addEventListener('click', () => {
    resetUploadState();
  });
}

/* ============================================================
   PROCESAMIENTO DE ARCHIVO
   ============================================================ */
function handleFileSelected(file) {
  // Validar extensión
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showProfileToast('Solo se permiten archivos con extensión .csv', 'error');
    return;
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE_BYTES) {
    showProfileToast(`El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB.`, 'error');
    return;
  }

  currentFile = file;

  // Mostrar nombre y tamaño
  updateFileInfo(file);

  // Leer y parsear el CSV
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      parsedCSV = parseCSV(e.target.result);
      validateAndRender();
    } catch (err) {
      console.error('[Perfiles] Error al leer CSV:', err);
      showProfileToast('No se pudo leer el archivo. Verifica que sea un CSV válido.', 'error');
      resetUploadState();
    }
  };
  reader.onerror = () => {
    showProfileToast('Error al leer el archivo.', 'error');
    resetUploadState();
  };
  reader.readAsText(file, 'UTF-8');
}

/* ── Mostrar información del archivo ── */
function updateFileInfo(file) {
  const previewArea = document.getElementById('preview-area');
  const nameEl      = document.getElementById('file-info-name');
  const sizeEl      = document.getElementById('file-info-size');

  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
  if (previewArea) {
    previewArea.hidden = false;
    previewArea.removeAttribute('aria-hidden');
  }
}

/* ── Resetear estado de carga ── */
function resetUploadState() {
  currentFile = null;
  parsedCSV   = null;
  csvIsValid  = false;

  const previewArea      = document.getElementById('preview-area');
  const csvValidation    = document.getElementById('csv-validation');
  const csvPreviewWrap   = document.getElementById('csv-preview-wrap');
  const saveBtn          = document.getElementById('save-profile-btn');
  const previewHead      = document.getElementById('csv-preview-head');
  const previewBody      = document.getElementById('csv-preview-body');
  const fileInput        = document.getElementById('csv-file-input');

  if (previewArea)    { previewArea.hidden = true; }
  if (csvValidation)  { csvValidation.innerHTML = ''; }
  if (csvPreviewWrap) { csvPreviewWrap.hidden = true; }
  if (saveBtn)        { saveBtn.disabled = true; }
  if (previewHead)    { previewHead.innerHTML = ''; }
  if (previewBody)    { previewBody.innerHTML = ''; }
  if (fileInput)      { fileInput.value = ''; }
}

/* ============================================================
   PARSER CSV
   ============================================================ */
function parseCSV(text) {
  // Normalizar saltos de línea
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter(l => l.trim() !== '');

  if (lines.length === 0) throw new Error('Archivo vacío');

  // Detectar separador: coma, punto y coma, o tabulador
  const headerLine = lines[0];
  let separator = ',';
  if ((headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length) {
    separator = ';';
  } else if ((headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length) {
    separator = '\t';
  }

  // Parsear cabeceras (trim + lowercase)
  const headers = headerLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

  // Parsear filas de datos
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = cols[idx]; });
      rows.push(row);
    }
  }

  return { headers, rows, separator };
}

/* ============================================================
   VALIDACIÓN PU-008
   ============================================================ */
function validateAndRender() {
  if (!parsedCSV) return;

  const { headers, rows } = parsedCSV;
  const validationEl = document.getElementById('csv-validation');
  const saveBtn      = document.getElementById('save-profile-btn');

  if (!validationEl) return;

  // Verificar cada columna requerida
  const results = REQUIRED_COLUMNS.map(col => {
    const present = headers.includes(col);
    return { col, present, ...PU008_ERRORS[col] };
  });

  // Advertencias adicionales
  const warnings = [];
  if (results.every(r => r.present) && rows.length > 0) {
    // WARN-PU-008-D: valores no numéricos en consumption_kwh
    const nonNumericKwh = rows.some(r => {
      const v = parseFloat(r['consumption_kwh']);
      return isNaN(v) || v < 0;
    });
    if (nonNumericKwh) {
      warnings.push({ code: 'WARN-PU-008-D', msg: 'Se detectaron valores nulos o negativos en "consumption_kwh".' });
    }

    // WARN-PU-008-E: peak_flag con valores distintos de 0 y 1
    const invalidPeakFlag = rows.some(r => !['0', '1'].includes((r['peak_flag'] || '').trim()));
    if (invalidPeakFlag) {
      warnings.push({ code: 'WARN-PU-008-E', msg: '"peak_flag" contiene valores distintos de 0 y 1.' });
    }
  }

  // Render de validación
  const errorsHTML = results.map(r => `
    <div class="validation-row ${r.present ? 'ok' : 'err'}" role="status">
      <i data-lucide="${r.present ? 'check-circle' : 'x-circle'}"></i>
      <span>
        ${r.present
          ? `<strong>${r.col}</strong> — columna encontrada correctamente`
          : `<strong>[${r.code}]</strong> ${r.msg}`
        }
      </span>
    </div>`).join('');

  const warningsHTML = warnings.map(w => `
    <div class="validation-row" style="color:#ffa000;" role="alert">
      <i data-lucide="alert-triangle"></i>
      <span><strong>[${w.code}]</strong> ${w.msg}</span>
    </div>`).join('');

  const allValid = results.every(r => r.present);
  csvIsValid = allValid;

  const summaryClass = allValid ? 'ok' : 'err';
  const summaryIcon  = allValid ? 'check-circle' : 'x-circle';
  const summaryText  = allValid
    ? `CSV válido — ${rows.length.toLocaleString('es-PE')} filas detectadas`
    : 'CSV inválido — corrige los errores indicados';

  validationEl.innerHTML = `
    <div class="validation-row ${summaryClass}" style="font-weight:700;padding-bottom:var(--space-2);border-bottom:1px solid rgba(0,229,255,0.08);margin-bottom:var(--space-1);">
      <i data-lucide="${summaryIcon}"></i>
      <span>${summaryText}</span>
    </div>
    ${errorsHTML}
    ${warningsHTML}
  `;

  lucide.createIcons();

  // Mostrar o habilitar botón
  if (saveBtn) saveBtn.disabled = !allValid;

  // Preview de primeras 5 filas
  if (allValid && rows.length > 0) {
    renderCSVPreview(headers, rows.slice(0, 5));
  } else {
    const csvPreviewWrap = document.getElementById('csv-preview-wrap');
    if (csvPreviewWrap) csvPreviewWrap.hidden = true;
  }
}

/* ============================================================
   TABLA DE PREVIEW
   ============================================================ */
function renderCSVPreview(headers, rows) {
  const wrap = document.getElementById('csv-preview-wrap');
  const head = document.getElementById('csv-preview-head');
  const body = document.getElementById('csv-preview-body');

  if (!wrap || !head || !body) return;

  head.innerHTML = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  body.innerHTML = rows.map(row => `
    <tr>${headers.map(h => `<td>${escapeHtml(row[h] ?? '')}</td>`).join('')}</tr>
  `).join('');

  wrap.hidden = false;
}

/* ============================================================
   GUARDAR PERFIL
   ============================================================ */
function bindSaveButton() {
  const btn = document.getElementById('save-profile-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!currentFile || !csvIsValid) return;

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader"></i> Guardando...';
    lucide.createIcons();

    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.add('uploading');

    try {
      // Intentar subir via FormData a la API
      let saved;
      try {
        const formData = new FormData();
        formData.append('file', currentFile);
        const res = await fetch(ENDPOINTS.uploadCSV, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('API error');
        saved = await res.json();
      } catch (_) {
        // Mock: simular respuesta del servidor
        await new Promise(r => setTimeout(r, 900));
        saved = {
          id: 'pf-' + Date.now(),
          name: currentFile.name.replace('.csv', ''),
          rows: parsedCSV?.rows?.length ?? 0,
          columns: parsedCSV?.headers ?? [],
          status: 'valid',
          uploaded_at: new Date().toISOString().slice(0, 10),
          project_count: 0
        };
      }

      // Añadir a la lista guardada
      MOCK.profiles.results.unshift(saved);
      renderSavedProfiles(MOCK.profiles.results);
      showProfileToast(`Perfil "${saved.name}" guardado correctamente.`, 'success');
      resetUploadState();

    } catch (err) {
      console.error('[Perfiles] Error al guardar perfil:', err);
      showProfileToast('No se pudo guardar el perfil. Inténtalo de nuevo.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      lucide.createIcons();
      if (dropZone) dropZone.classList.remove('uploading');
    }
  });
}

/* ============================================================
   CARGAR PERFILES GUARDADOS
   ============================================================ */
async function loadSavedProfiles() {
  try {
    const data = await fetchOrMock(ENDPOINTS.profiles, MOCK.profiles);
    const profiles = Array.isArray(data) ? data : (data.results || []);
    renderSavedProfiles(profiles);
  } catch (_) {
    renderSavedProfiles(MOCK.profiles.results || []);
  }
}

/* ── Renderizar tabla de perfiles ── */
function renderSavedProfiles(profiles) {
  const tbody   = document.getElementById('profiles-table-body');
  const countEl = document.getElementById('profiles-count');

  if (countEl) {
    countEl.textContent = `${profiles.length} perfil${profiles.length !== 1 ? 'es' : ''}`;
  }

  if (!tbody) return;

  if (profiles.length === 0) {
    tbody.innerHTML = `
      <tr class="table-empty-row">
        <td colspan="6" style="text-align:center;padding:var(--space-10);color:var(--text3);font-size:var(--text-sm);">
          No hay perfiles guardados. Carga tu primer CSV.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = profiles.map(p => {
    const isValid = p.status === 'valid';
    const badgeClass = isValid ? 'badge-success' : 'badge-error';
    const badgeLabel = isValid ? 'Válido' : 'Error';
    const dateStr = p.uploaded_at
      ? new Date(p.uploaded_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    const errorRow = (!isValid && p.error)
      ? `<div class="profile-error"><i data-lucide="alert-circle"></i>${escapeHtml(p.error)}</div>`
      : '';

    return /* html */`
    <tr>
      <td>
        <div class="profile-name">${escapeHtml(p.name)}</div>
        ${errorRow}
      </td>
      <td style="font-family:var(--font-mono);">${(p.rows ?? 0).toLocaleString('es-PE')}</td>
      <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
      <td style="font-family:var(--font-mono);">${p.project_count ?? 0}</td>
      <td style="font-family:var(--font-mono);white-space:nowrap;">${dateStr}</td>
      <td>
        <div class="table-actions" style="justify-content:flex-end;">
          <button
            class="btn-icon-table accent"
            data-action="associate"
            data-profile-id="${p.id}"
            data-profile-name="${escapeHtml(p.name)}"
            title="Asociar perfil a un proyecto"
            aria-label="Asociar perfil ${escapeHtml(p.name)} a un proyecto"
          >
            <i data-lucide="link"></i>
          </button>
          <button
            class="btn-icon-table danger"
            data-action="delete-profile"
            data-profile-id="${p.id}"
            data-profile-name="${escapeHtml(p.name)}"
            title="Eliminar perfil"
            aria-label="Eliminar perfil ${escapeHtml(p.name)}"
          >
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  lucide.createIcons();

  // Vincular eventos de acciones
  tbody.querySelectorAll('[data-action="associate"]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleAssociateProfile(btn.dataset.profileId, btn.dataset.profileName);
    });
  });

  tbody.querySelectorAll('[data-action="delete-profile"]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleDeleteProfile(btn.dataset.profileId, btn.dataset.profileName);
    });
  });
}

/* ── Asociar perfil ── */
function handleAssociateProfile(id, name) {
  showProfileToast(`Función de asociación próximamente disponible. Perfil: "${name}"`, 'info');
}

/* ── Eliminar perfil ── */
async function handleDeleteProfile(id, name) {
  const confirmed = window.confirm(`¿Eliminar el perfil "${name}"?\n\nSi está asociado a proyectos, deberá reasignarse.`);
  if (!confirmed) return;

  try {
    // Mock: eliminar del array local
    await new Promise(r => setTimeout(r, 350));
    const idx = MOCK.profiles.results.findIndex(p => p.id === id);
    if (idx !== -1) MOCK.profiles.results.splice(idx, 1);
    renderSavedProfiles(MOCK.profiles.results);
    showProfileToast(`Perfil "${name}" eliminado.`, 'warn');
  } catch (err) {
    console.error('[Perfiles] Error al eliminar perfil:', err);
    showProfileToast('No se pudo eliminar el perfil.', 'error');
  }
}

/* ============================================================
   MODAL DE FORMATO
   ============================================================ */
function bindFormatModal() {
  const openBtn  = document.getElementById('format-info-btn');
  const overlay  = document.getElementById('format-modal');
  const closeBtn = document.getElementById('close-format-modal');
  const okBtn    = document.getElementById('close-format-modal-ok');

  const open  = () => { overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; lucide.createIcons(); };
  const close = () => { overlay?.classList.remove('open'); document.body.style.overflow = ''; };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  okBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => { if (e.target === e.currentTarget) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ============================================================
   UTILIDADES
   ============================================================ */

/** Formatea tamaño de archivo a KB o MB. */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Escapa HTML para prevenir XSS. */
if (typeof escapeHtml === 'undefined') {
  window.escapeHtml = function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
}

/** Toast de notificación específico para perfiles. */
function showProfileToast(message, type = 'info', duration = 4000) {
  if (typeof showToast === 'function') {
    showToast(message, type, duration);
    return;
  }
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap  = { success: 'check-circle', error: 'x-circle', warn: 'alert-triangle', info: 'info' };
  const colorMap = { success: '#00e564', error: '#ff3250', warn: '#ffa000', info: 'var(--cyan)' };

  const toast = document.createElement('div');
  toast.style.cssText = `
    display:flex;align-items:center;gap:10px;
    background:rgba(8,18,23,0.97);
    border:1px solid ${colorMap[type] || 'var(--border)'};
    border-left:3px solid ${colorMap[type] || 'var(--cyan)'};
    color:var(--text);
    padding:12px 16px;
    border-radius:8px;
    font-size:14px;
    font-family:var(--font-ui);
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    max-width:400px;
    cursor:pointer;
    margin-bottom:8px;
  `;
  toast.innerHTML = `<i data-lucide="${iconMap[type] || 'info'}" style="width:16px;height:16px;flex-shrink:0;color:${colorMap[type]};"></i><span>${escapeHtml(message)}</span>`;
  toast.addEventListener('click', () => toast.remove());

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
