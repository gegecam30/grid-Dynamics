/* ============================================
   GRID DYNAMICS — Simulation Page JS
   Handles project loading, simulation run,
   progress animation and recent simulations.
   ============================================ */

// Guard — redirect if not authenticated
if (typeof requireAuth === 'function') requireAuth('../pages/login.html');

/* -------------------------------------------------- */
/*  Page init                                          */
/* -------------------------------------------------- */
async function initSimulatePage() {
  await loadProjectsSelector();
  await renderRecentSims();
  setupDurationSlider();
  document.getElementById('run-sim-btn')?.addEventListener('click', runSimulation);
}

/* -------------------------------------------------- */
/*  Load projects into the selector                    */
/* -------------------------------------------------- */
async function loadProjectsSelector() {
  try {
    const { results: projects } = await fetchOrMock(ENDPOINTS.projects, MOCK.projects);
    const sel = document.getElementById('sim-project-select');
    if (!sel || !projects) return;

    sel.innerHTML =
      '<option value="">— Selecciona un proyecto —</option>' +
      projects.map(p =>
        `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.status === 'draft' ? ' (Borrador)' : ''}</option>`
      ).join('');
  } catch (err) {
    console.error('[simulate] Error cargando proyectos:', err);
    const sel = document.getElementById('sim-project-select');
    if (sel) {
      sel.innerHTML = '<option value="">— Error al cargar proyectos —</option>';
    }
  }
}

/* -------------------------------------------------- */
/*  Render recent simulations table                    */
/* -------------------------------------------------- */
async function renderRecentSims() {
  try {
    const { results } = await fetchOrMock(ENDPOINTS.simulate, MOCK.simulations);
    const tbody = document.getElementById('recent-sims-tbody');
    if (!tbody || !results || !results.length) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;padding:var(--space-6)">
              <div class="empty-state" style="padding:0">
                <div class="empty-state-icon"><i data-lucide="inbox"></i></div>
                <p style="color:var(--text3);font-size:var(--text-sm)">Sin simulaciones recientes</p>
              </div>
            </td>
          </tr>`;
        lucide.createIcons();
      }
      return;
    }

    const demandLabels = {
      residential: 'Residencial',
      commercial:  'Comercial',
      industrial:  'Industrial',
      mixed:       'Mixto'
    };

    const statusBadge = {
      completed: '<span class="badge badge-success">Completado</span>',
      error:     '<span class="badge badge-error">Error</span>',
      pending:   '<span class="badge badge-warn">Pendiente</span>',
      running:   '<span class="badge badge-cyber">Ejecutando</span>'
    };

    tbody.innerHTML = results.slice(0, 3).map(s => `
      <tr>
        <td>
          <span style="color:var(--text);font-weight:500">${escapeHtml(s.project_name)}</span>
        </td>
        <td>
          <span class="badge badge-muted">${escapeHtml(demandLabels[s.demand_type] || s.demand_type)}</span>
        </td>
        <td>
          <span style="font-family:var(--font-mono);font-size:var(--text-sm)">${s.duration_hours}h</span>
        </td>
        <td>
          <span style="color:var(--cyan);font-family:var(--font-mono);font-weight:600">${s.efficiency}%</span>
        </td>
        <td>
          <span style="color:var(--text3);font-size:var(--text-xs)">${formatDate(s.created_at)}</span>
        </td>
      </tr>`).join('');

    lucide.createIcons();
  } catch (err) {
    console.error('[simulate] Error cargando simulaciones recientes:', err);
  }
}

/* -------------------------------------------------- */
/*  Duration slider live update                        */
/* -------------------------------------------------- */
function setupDurationSlider() {
  const slider = document.getElementById('sim-duration');
  const valEl  = document.getElementById('sim-duration-val');
  if (!slider || !valEl) return;

  slider.addEventListener('input', () => {
    valEl.textContent = slider.value;
    slider.setAttribute('aria-valuenow', slider.value);
  });
}

/* -------------------------------------------------- */
/*  Run simulation                                     */
/* -------------------------------------------------- */
async function runSimulation() {
  const btn       = document.getElementById('run-sim-btn');
  const projectId = document.getElementById('sim-project-select')?.value;

  // Validate project selection
  if (!projectId) {
    showToast('Selecciona un proyecto primero', 'warn');
    document.getElementById('sim-project-select')?.focus();
    return;
  }

  // Gather form values
  const demandType = document.querySelector('input[name="demand-type"]:checked')?.value || 'residential';
  const duration   = document.getElementById('sim-duration')?.value || '24';
  const genModes   = [...document.querySelectorAll('input[name="gen-modes"]:checked')].map(el => el.value);

  if (!genModes.length) {
    showToast('Selecciona al menos un modo de generación', 'warn');
    return;
  }

  // UI — start loading state
  setButtonLoading(btn, true, 'Simulando...');
  setSimulationState('running');

  const fill       = document.getElementById('sim-progress-fill');
  const statusText = document.getElementById('sim-status-text');
  const progressBar= fill?.closest('[role="progressbar"]');

  // Progress animation
  let pct = 0;
  const MESSAGES = [
    'Inicializando entorno de simulación...',
    'Analizando topología de la red...',
    'Calculando flujo de potencia...',
    'Optimizando parámetros energéticos...',
    'Procesando balance de generación...',
    'Evaluando escenarios de demanda...',
    'Calculando reducción de CO₂...',
    'Generando informe de resultados...'
  ];
  let msgIdx = 0;

  const interval = setInterval(() => {
    const increment = Math.random() * 12 + 3;
    pct = Math.min(pct + increment, 92);

    if (fill) fill.style.width = pct + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct));
    if (statusText) {
      const newMsgIdx = Math.min(Math.floor(pct / 12), MESSAGES.length - 1);
      if (newMsgIdx !== msgIdx) {
        msgIdx = newMsgIdx;
        statusText.textContent = MESSAGES[msgIdx];
      }
    }
  }, 600);

  try {
    // Call API / mock
    const payload = {
      project_id:  projectId,
      demand_type: demandType,
      duration_hours: parseInt(duration, 10),
      gen_modes:   genModes
    };

    await fetchOrMock(ENDPOINTS.simulate, { id: 's-new', status: 'completed', ...payload });

    // Complete progress bar
    clearInterval(interval);
    if (fill) fill.style.width = '100%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', 100);
    if (statusText) statusText.textContent = '¡Simulación completada exitosamente!';

    setSimulationState('completed');

    // Show result preview
    const preview = document.getElementById('sim-result-preview');
    if (preview) preview.classList.add('visible');

    showToast('Simulación completada. Redirigiendo a resultados...', 'success');

    setTimeout(() => {
      window.location.href = 'results.html';
    }, 2500);

  } catch (err) {
    clearInterval(interval);
    setSimulationState('error');
    if (statusText) statusText.textContent = 'Error en la simulación. Intenta de nuevo.';
    if (fill) fill.style.width = pct + '%'; // leave at current pct

    showToast(err.message || 'Error al ejecutar la simulación', 'error');
    setButtonLoading(btn, false);

  } finally {
    // Only restore button if not redirecting
    if (document.getElementById('sim-result-preview')?.classList.contains('visible') === false) {
      setButtonLoading(btn, false);
    }
  }
}

/* -------------------------------------------------- */
/*  Status dot helper                                  */
/* -------------------------------------------------- */
function setSimulationState(state) {
  const dot   = document.querySelector('.sim-status-dot');
  const label = document.getElementById('sim-status-label');
  if (!dot) return;

  const states = {
    ready:     { cls: 'completed', text: 'Lista para ejecutar' },
    running:   { cls: 'running',   text: 'Ejecutando...' },
    completed: { cls: 'completed', text: 'Completada' },
    error:     { cls: 'error',     text: 'Error en la simulación' }
  };

  const s = states[state] || states.ready;
  dot.className = `status-dot ${s.cls} sim-status-dot`;
  if (label) label.textContent = s.text;
}

/* -------------------------------------------------- */
/*  Auto-init on DOMContentLoaded                      */
/*  (called from inline script after lucide.createIcons)
/* -------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // initSimulatePage is called from the inline <script> in the HTML
  // after requireAuth and lucide.createIcons — this is a safety net.
  if (typeof initSimulatePage === 'function' && !window._simPageInit) {
    window._simPageInit = true;
    initSimulatePage();
  }
});
