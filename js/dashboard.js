/* ============================================
   GRID DYNAMICS — Dashboard lógico v2
   Compatibe con Top Nav + Lucide Icons
   ============================================ */

/* ---- Proyectos (CRUD) ---- */
async function loadProjects() {
  const container = document.getElementById('projects-list');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:120px;border-radius:var(--radius-lg)"></div>'.repeat(3);

  try {
    const { results } = await fetchOrMock(ENDPOINTS.projects, MOCK.projects);
    if (!results?.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
          <h3>Sin proyectos aún</h3>
          <p>Crea tu primer proyecto para comenzar a simular microrredes.</p>
          <a href="editor.html" class="btn btn-primary"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="display:inline"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nuevo Proyecto</a>
        </div>`;
      return;
    }
    // Show only first 6 on dashboard
    container.innerHTML = results.slice(0, 6).map(p => renderProjectCard(p)).join('');
    lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<p style="color:#ff3250;font-size:var(--text-sm);grid-column:1/-1"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:6px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ${err.message}</p>`;
  }
}

function renderProjectCard(p) {
  const statusClass = { running: 'running', completed: 'completed', error: 'error', pending: 'pending', draft: 'draft' };
  const statusLabel = { running: 'Activo', completed: 'Completado', error: 'Error', pending: 'Pendiente', draft: 'Borrador' };
  return `
    <div class="card project-card" data-id="${p.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-2);margin-bottom:var(--space-2)">
        <h3 style="font-size:var(--text-base);color:var(--text);line-height:1.3">${escapeHtml(p.name)}</h3>
        <span class="status-dot ${statusClass[p.status] || 'draft'}" style="flex-shrink:0;margin-top:3px">${statusLabel[p.status] || p.status}</span>
      </div>
      <p style="font-size:var(--text-sm);color:var(--text2);margin-bottom:var(--space-3)">${escapeHtml(p.description || '—')}</p>
      <div style="display:flex;align-items:center;gap:var(--space-4);font-size:var(--text-xs);color:var(--text3);margin-bottom:var(--space-4)">
        <span style="display:flex;align-items:center;gap:4px"><i data-lucide="git-branch" style="width:13px;height:13px;stroke-width:2"></i> ${p.nodes || 0} nodos</span>
        <span style="display:flex;align-items:center;gap:4px"><i data-lucide="clock" style="width:13px;height:13px;stroke-width:2"></i> ${p.last_simulation ? formatDate(p.last_simulation) : 'Sin simular'}</span>
      </div>
      <div class="project-card-actions">
        <a href="editor.html?id=${p.id}" class="btn btn-outline" style="flex:1;justify-content:center;font-size:var(--text-sm)">
          <i data-lucide="network"></i>Editor
        </a>
        <a href="simulate.html?id=${p.id}" class="btn btn-ghost" style="flex:1;justify-content:center;font-size:var(--text-sm)">
          <i data-lucide="zap"></i>Simular
        </a>
        <button class="btn btn-ghost" onclick="deleteProject('${p.id}','${escapeHtml(p.name)}')" aria-label="Eliminar proyecto ${escapeHtml(p.name)}" style="color:#ff3250;padding:var(--space-2) var(--space-3)">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>`;
}

async function createProject(formData) {
  const btn = document.getElementById('create-project-btn');
  setButtonLoading(btn, true, 'Creando...');
  try {
    await fetchOrMock(ENDPOINTS.projects, { id: 'new-' + Date.now(), ...formData });
    showToast('Proyecto creado correctamente', 'success');
    await loadProjects();
  } catch (err) {
    showToast(err.message || 'Error al crear proyecto', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function deleteProject(id, name) {
  if (!confirm(`¿Eliminar el proyecto "${name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await fetchOrMock(ENDPOINTS.project?.(id) || ENDPOINTS.projects, null);
    showToast('Proyecto eliminado', 'info');
    await loadProjects();
  } catch (err) {
    showToast(err.message || 'Error al eliminar', 'error');
  }
}

/* ---- Simulación ---- */
async function runSimulation(projectId, config) {
  const btn = document.getElementById('run-sim-btn');
  setButtonLoading(btn, true, 'Simulando...');
  try {
    const result = await fetchOrMock(ENDPOINTS.simulate, MOCK.simulationResult);
    showToast('Simulación completada', 'success');
    return result;
  } catch (err) {
    showToast(err.message || 'Error en la simulación', 'error');
    return null;
  } finally {
    setButtonLoading(btn, false);
  }
}

/* ---- CSV Upload ---- */
async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  const token = sessionStorage.getItem('gd_token');
  const res = await fetch(ENDPOINTS.uploadCSV, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al subir archivo');
  }
  return res.json();
}

// Init
document.addEventListener('DOMContentLoaded', loadProjects);