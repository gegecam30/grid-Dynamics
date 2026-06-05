/* ============================================================
   GRID DYNAMICS — projects.js
   Lógica CRUD de proyectos: carga, filtrado, creación y
   eliminación. Utiliza fetchOrMock como capa de datos.
   ============================================================ */

/* ── Estado interno ── */
let allProjects = [];   // copia en memoria de todos los proyectos
let activeFilter = 'all';

/* ── Mapa de etiquetas de estado ── */
const STATUS_LABELS = {
  running:   'Activo',
  completed: 'Completado',
  draft:     'Borrador',
  error:     'Error',
  pending:   'Pendiente'
};

/* ── Mapa de clases de estado ── */
const STATUS_CLASS = {
  running:   'running',
  completed: 'completed',
  draft:     'draft',
  error:     'error',
  pending:   'pending'
};

/* ============================================================
   INICIALIZACIÓN PRINCIPAL
   ============================================================ */
async function initProjects() {
  bindFilterChips();
  bindSearchInput();
  bindCreateModal();
  bindEmptyStateBtn();
  await loadProjects();
}

/* ============================================================
   CARGA DE DATOS
   ============================================================ */
async function loadProjects() {
  try {
    const data = await fetchOrMock(ENDPOINTS.projects, MOCK.projects);
    allProjects = Array.isArray(data) ? data : (data.results || []);
    renderProjects(allProjects);
  } catch (err) {
    console.error('[Proyectos] Error al cargar proyectos:', err);
    showToast('Error al cargar los proyectos. Usando datos demo.', 'error');
    allProjects = MOCK.projects.results || [];
    renderProjects(allProjects);
  }
}

/* ============================================================
   RENDERIZADO
   ============================================================ */
function renderProjects(list) {
  const grid      = document.getElementById('projects-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl   = document.getElementById('results-count');

  if (!grid) return;

  // Actualizar contador
  if (countEl) {
    countEl.textContent = list.length === 0
      ? 'Sin resultados'
      : `${list.length} proyecto${list.length !== 1 ? 's' : ''} encontrado${list.length !== 1 ? 's' : ''}`;
  }

  if (list.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.removeAttribute('aria-hidden');
    }
    return;
  }

  // Mostrar grilla
  if (emptyState) {
    emptyState.hidden = true;
    emptyState.setAttribute('aria-hidden', 'true');
  }
  grid.style.display = 'grid';

  grid.innerHTML = list.map(p => buildProjectCard(p)).join('');
  lucide.createIcons();

  // Eventos de acciones en cada tarjeta
  grid.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleDeleteProject(btn.dataset.deleteId, btn.dataset.deleteName);
    });
  });
}

/* ── Construcción de tarjeta HTML ── */
function buildProjectCard(p) {
  const statusClass = STATUS_CLASS[p.status] || 'draft';
  const statusLabel = STATUS_LABELS[p.status] || p.status;

  const lastSim = p.last_simulation
    ? formatDate(p.last_simulation)
    : 'Sin simulaciones';

  return /* html */`
  <article class="card project-card" role="listitem" aria-label="Proyecto: ${escapeHtml(p.name)}">
    <div class="project-card-status-strip ${statusClass}" aria-hidden="true"></div>
    <div class="project-card-header">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-3);">
        <div class="project-card-title">${escapeHtml(p.name)}</div>
        <span class="status-dot ${statusClass}" style="flex-shrink:0;margin-top:3px;" aria-label="Estado: ${statusLabel}">
          ${statusLabel}
        </span>
      </div>
      <p class="project-card-desc">${escapeHtml(p.description || 'Sin descripción.')}</p>
    </div>

    <div class="project-card-meta">
      <span class="project-meta-item" title="Nodos en la topología">
        <i data-lucide="git-branch"></i>
        ${p.nodes ?? 0} nodos
      </span>
      <span class="project-meta-item" title="Última simulación">
        <i data-lucide="clock"></i>
        ${escapeHtml(lastSim)}
      </span>
      <span class="project-meta-item" title="Fecha de creación">
        <i data-lucide="calendar"></i>
        ${formatDate(p.created_at)}
      </span>
    </div>

    <div class="project-card-footer">
      <a href="editor.html?id=${encodeURIComponent(p.id)}" class="btn btn-outline" title="Abrir editor de topología">
        <i data-lucide="network"></i>
        Editor
      </a>
      <a href="simulate.html?project=${encodeURIComponent(p.id)}" class="btn btn-ghost" title="Iniciar simulación">
        <i data-lucide="zap"></i>
        Simular
      </a>
      <span class="spacer"></span>
      <button
        class="btn-icon-danger"
        data-delete-id="${p.id}"
        data-delete-name="${escapeHtml(p.name)}"
        aria-label="Eliminar proyecto ${escapeHtml(p.name)}"
        title="Eliminar proyecto"
      >
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  </article>`;
}

/* ============================================================
   FILTRADO (client-side)
   ============================================================ */
function filterProjects() {
  const query  = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const filter = activeFilter;

  let result = allProjects;

  // Filtro por texto
  if (query) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query)
    );
  }

  // Filtro por estado
  if (filter !== 'all') {
    result = result.filter(p => p.status === filter);
  }

  renderProjects(result);
}

/* ── Chips de filtro ── */
function bindFilterChips() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      activeFilter = chip.dataset.filter;
      filterProjects();
    });
  });
}

/* ── Input de búsqueda ── */
function bindSearchInput() {
  const input = document.getElementById('search-input');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterProjects, 250);
  });

  // Limpiar al presionar Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      filterProjects();
    }
  });
}

/* ============================================================
   MODAL: CREAR PROYECTO
   ============================================================ */
function openCreateModal() {
  const overlay = document.getElementById('create-modal');
  const form    = document.getElementById('create-project-form');
  if (!overlay) return;

  if (form) form.reset();
  resetFormErrors();
  const descCount = document.getElementById('desc-count');
  if (descCount) descCount.textContent = '0';

  overlay.classList.add('open');
  overlay.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('project-name')?.focus();
  }, 100);
}

function closeCreateModal() {
  const overlay = document.getElementById('create-modal');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function bindCreateModal() {
  // Botón abrir
  document.getElementById('open-create-modal')?.addEventListener('click', openCreateModal);

  // Botón cerrar / cancelar
  document.getElementById('close-create-modal')?.addEventListener('click', closeCreateModal);
  document.getElementById('cancel-create-modal')?.addEventListener('click', closeCreateModal);

  // Clic fuera del modal
  document.getElementById('create-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCreateModal();
  });

  // Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCreateModal();
  });

  // Contador de descripción
  document.getElementById('project-desc')?.addEventListener('input', (e) => {
    const count = document.getElementById('desc-count');
    if (count) count.textContent = e.target.value.length;
  });

  // Submit del formulario
  document.getElementById('create-project-form')?.addEventListener('submit', handleCreateProject);
}

function bindEmptyStateBtn() {
  document.getElementById('empty-create-btn')?.addEventListener('click', openCreateModal);
}

/* ── Validación inline ── */
function resetFormErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
  document.querySelectorAll('.input.error').forEach(el => el.classList.remove('error'));
}

function showFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);
  if (field) field.classList.add('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/* ── Manejar creación ── */
async function handleCreateProject(e) {
  e.preventDefault();
  resetFormErrors();

  const name = document.getElementById('project-name')?.value.trim() || '';
  const desc = document.getElementById('project-desc')?.value.trim() || '';
  const type = document.getElementById('project-type')?.value || 'residential';

  // Validación
  let valid = true;
  if (!name) {
    showFieldError('project-name', 'name-error', 'El nombre del proyecto es obligatorio.');
    valid = false;
  } else if (name.length < 3) {
    showFieldError('project-name', 'name-error', 'El nombre debe tener al menos 3 caracteres.');
    valid = false;
  }
  if (!valid) return;

  const submitBtn = document.getElementById('create-project-btn');
  const originalHTML = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader"></i> Creando...';
    lucide.createIcons();

    const payload = { name, description: desc, type };

    // Intentar POST a la API, si falla usar mock
    let newProject;
    try {
      const res = await fetch(ENDPOINTS.projects, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('API error');
      newProject = await res.json();
    } catch (_) {
      // Mock: generar proyecto local
      await new Promise(r => setTimeout(r, 700));
      newProject = {
        id: 'p-' + Date.now(),
        name,
        description: desc,
        type,
        status: 'draft',
        nodes: 0,
        last_simulation: null,
        created_at: new Date().toISOString().slice(0, 10)
      };
    }

    // Añadir al array local y re-renderizar
    allProjects.unshift(newProject);
    filterProjects();
    closeCreateModal();
    showToast(`Proyecto "${name}" creado correctamente.`, 'success');

  } catch (err) {
    console.error('[Proyectos] Error al crear proyecto:', err);
    showToast('No se pudo crear el proyecto. Inténtalo de nuevo.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
      lucide.createIcons();
    }
  }
}

/* ============================================================
   ELIMINAR PROYECTO
   ============================================================ */
async function handleDeleteProject(id, name) {
  const confirmed = window.confirm(
    `¿Estás seguro de que deseas eliminar el proyecto "${name}"?\n\nEsta acción no se puede deshacer.`
  );
  if (!confirmed) return;

  try {
    // Intentar DELETE a la API
    try {
      const res = await fetch(`${ENDPOINTS.projects}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('API error');
    } catch (_) {
      // Mock: simular latencia de eliminación
      await new Promise(r => setTimeout(r, 400));
    }

    // Eliminar del array local y re-renderizar
    allProjects = allProjects.filter(p => p.id !== id);
    filterProjects();
    showToast(`Proyecto "${name}" eliminado.`, 'warn');

  } catch (err) {
    console.error('[Proyectos] Error al eliminar proyecto:', err);
    showToast('No se pudo eliminar el proyecto. Inténtalo de nuevo.', 'error');
  }
}

/* ============================================================
   UTILIDADES
   ============================================================ */

/**
 * Escapa HTML para prevenir XSS.
 * (Si ya existe en base.css/nav.js se reutiliza automáticamente,
 *  de lo contrario se define aquí como respaldo.)
 */
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

/**
 * Formatea una fecha ISO a formato local español.
 */
if (typeof formatDate === 'undefined') {
  window.formatDate = function(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  };
}

/**
 * Muestra un toast de notificación.
 * Si showToast no está definido (por nav.js), se define aquí.
 */
if (typeof showToast === 'undefined') {
  window.showToast = function(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconMap = { success: 'check-circle', error: 'x-circle', warn: 'alert-triangle', info: 'info' };
    const colorMap = { success: '#00e564', error: '#ff3250', warn: '#ffa000', info: 'var(--cyan)' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
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
      animation:toastIn 0.25s ease;
      max-width:400px;
      cursor:pointer;
    `;
    toast.innerHTML = `<i data-lucide="${iconMap[type] || 'info'}" style="width:16px;height:16px;flex-shrink:0;color:${colorMap[type]};"></i><span>${escapeHtml(message)}</span>`;
    toast.addEventListener('click', () => toast.remove());

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(16px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };
}
