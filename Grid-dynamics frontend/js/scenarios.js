/* ============================================
   GRID DYNAMICS — Scenarios JS
   Comparación lado a lado de dos simulaciones
   ============================================ */

'use strict';

let compareChart = null;

/* ============================================================
   INIT
   ============================================================ */
async function initScenarios() {
  await loadSimulationOptions();
  bindCompareBtn();
  // Auto-comparar con datos mock al cargar la página
  await autoCompareWithMock();
}

/* ============================================================
   CARGAR OPCIONES EN LOS SELECTORES
   ============================================================ */
async function loadSimulationOptions() {
  const data = await fetchOrMock(ENDPOINTS.simulate, MOCK.simulations);
  const simulations = data.results || [];

  const selectA = document.getElementById('select-a');
  const selectB = document.getElementById('select-b');
  if (!selectA || !selectB) return;

  const defaultOpt = '<option value="">— Selecciona una simulación —</option>';
  const optionsHtml = simulations.map(s => {
    const statusLabel = {
      completed: 'Completada',
      running:   'En ejecución',
      pending:   'Pendiente',
      error:     'Error'
    }[s.status] || s.status;
    return `<option value="${s.id}">${escapeHtml(s.project_name)} — ${s.duration_hours}h (${statusLabel})</option>`;
  }).join('');

  selectA.innerHTML = defaultOpt + optionsHtml;
  selectB.innerHTML = defaultOpt + optionsHtml;

  // Pre-seleccionar los dos primeros si hay datos
  if (simulations.length >= 1) selectA.value = simulations[0].id;
  if (simulations.length >= 2) selectB.value = simulations[simulations.length - 1].id;
}

/* ============================================================
   BIND BOTÓN COMPARAR
   ============================================================ */
function bindCompareBtn() {
  const btn = document.getElementById('compare-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const aId = document.getElementById('select-a')?.value;
    const bId = document.getElementById('select-b')?.value;

    if (!aId || !bId) {
      showToast('Selecciona dos escenarios para comparar.', 'warn');
      return;
    }
    if (aId === bId) {
      showToast('Selecciona dos escenarios diferentes.', 'warn');
      return;
    }

    setButtonLoading(btn, true, 'Comparando...');

    try {
      // Simular búsqueda de simulaciones por ID
      const allSims = (MOCK.simulations.results || []);
      const simA = allSims.find(s => s.id === aId);
      const simB = allSims.find(s => s.id === bId);

      if (!simA || !simB) {
        showToast('No se encontraron los datos de los escenarios seleccionados.', 'error');
        return;
      }

      // Convertir al formato de comparación
      const scenarioA = buildScenarioFromSim(simA);
      const scenarioB = buildScenarioFromSim(simB);

      renderComparison(scenarioA, scenarioB);
      showToast('Comparación generada correctamente.', 'success');
    } catch (err) {
      showToast('Error al cargar la comparación.', 'error');
      console.error(err);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

/* ============================================================
   AUTO-COMPARAR CON MOCK AL CARGAR
   ============================================================ */
async function autoCompareWithMock() {
  try {
    const data = await fetchOrMock(ENDPOINTS.compare, MOCK.scenarios.comparison);
    const { scenario_a, scenario_b } = data;
    renderComparison(scenario_a, scenario_b);
  } catch (err) {
    console.warn('[Scenarios] Error al cargar comparación automática:', err);
  }
}

/* ============================================================
   CONSTRUIR OBJETO ESCENARIO DESDE SIMULACIÓN
   ============================================================ */
function buildScenarioFromSim(sim) {
  return {
    id:               sim.id,
    name:             `${sim.project_name} — ${sim.duration_hours}h`,
    efficiency:       sim.efficiency       ?? 0,
    co2_reduced:      sim.co2_reduced      ?? 0,
    total_cost:       sim.total_cost       ?? 0,
    savings:          sim.savings          ?? 0,
    peak_demand:      sim.peak_demand      ?? 0,
    solar_share:      sim.solar_share      ?? 60,
    battery_capacity: sim.battery_capacity ?? 80,
    nodes:            sim.nodes            ?? 10
  };
}

/* ============================================================
   RENDER COMPARACIÓN COMPLETA
   ============================================================ */
function renderComparison(a, b) {
  const resultsEl = document.getElementById('comparison-results');
  if (resultsEl) resultsEl.style.display = '';

  renderWinnerBanner(a, b);
  renderKPIComparison(a, b);
  renderCompareChart(a, b);
  renderComparisonTable(a, b);

  // Actualizar encabezados de la tabla
  const thA = document.getElementById('th-a');
  const thB = document.getElementById('th-b');
  if (thA) thA.textContent = a.name || 'Escenario A';
  if (thB) thB.textContent = b.name || 'Escenario B';

  // Re-inicializar iconos de Lucide
  if (window.lucide) lucide.createIcons();
}

/* ============================================================
   DETERMINAR GANADOR
   Mayor eficiencia gana
   ============================================================ */
function determineWinner(a, b) {
  return a.efficiency >= b.efficiency ? 'a' : 'b';
}

/* ============================================================
   RENDER WINNER BANNER
   ============================================================ */
function renderWinnerBanner(a, b) {
  const winner = determineWinner(a, b);
  const winnerData = winner === 'a' ? a : b;
  const loserData  = winner === 'a' ? b : a;
  const effDiff    = Math.abs(a.efficiency - b.efficiency).toFixed(1);

  const nameEl = document.getElementById('winner-name');
  const descEl = document.getElementById('winner-desc');
  if (nameEl) nameEl.textContent = `Escenario Óptimo: ${winnerData.name}`;
  if (descEl) descEl.textContent =
    `${winnerData.name} supera a ${loserData.name} en eficiencia energética ` +
    `por ${effDiff}% (${formatNumber(winnerData.efficiency, 1)}% vs ${formatNumber(loserData.efficiency, 1)}%). ` +
    `Ahorro adicional: S/ ${formatNumber(Math.abs(a.savings - b.savings), 0)} y ` +
    `${Math.abs(a.co2_reduced - b.co2_reduced)} kg CO₂ menos.`;
}

/* ============================================================
   RENDER KPI COMPARISON
   ============================================================ */
function renderKPIComparison(a, b) {
  // Eficiencia
  setText('kpi-eff-a', `${formatNumber(a.efficiency, 1)}%`);
  setText('kpi-eff-b', `${formatNumber(b.efficiency, 1)}%`);
  // CO2
  setText('kpi-co2-a', `${formatNumber(a.co2_reduced, 0)} kg`);
  setText('kpi-co2-b', `${formatNumber(b.co2_reduced, 0)} kg`);
  // Costo
  setText('kpi-cost-a', `S/ ${formatNumber(a.total_cost, 0)}`);
  setText('kpi-cost-b', `S/ ${formatNumber(b.total_cost, 0)}`);
  // Ahorro
  setText('kpi-save-a', `S/ ${formatNumber(a.savings, 0)}`);
  setText('kpi-save-b', `S/ ${formatNumber(b.savings, 0)}`);
}

/* ============================================================
   RENDER BAR CHART
   ============================================================ */
function renderCompareChart(a, b) {
  const ctx = document.getElementById('compare-chart');
  if (!ctx) return;

  // Destruir chart anterior si existe
  if (compareChart) {
    compareChart.destroy();
    compareChart = null;
  }

  const labels     = ['Eficiencia (%)', 'CO₂ reducido (kg/10)', 'Ahorro (S//1000)', 'Energía Solar (%)'];
  const dataA      = [
    a.efficiency,
    a.co2_reduced / 10,
    a.savings / 1000,
    a.solar_share ?? 60
  ];
  const dataB      = [
    b.efficiency,
    b.co2_reduced / 10,
    b.savings / 1000,
    b.solar_share ?? 55
  ];

  compareChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: a.name || 'Escenario A',
          data: dataA,
          backgroundColor: 'rgba(0, 229, 255, 0.25)',
          borderColor:     'rgba(0, 229, 255, 0.9)',
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false
        },
        {
          label: b.name || 'Escenario B',
          data: dataB,
          backgroundColor: 'rgba(124, 58, 237, 0.25)',
          borderColor:     'rgba(124, 58, 237, 0.9)',
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: 'var(--text2)',
            font: { family: 'Rajdhani, sans-serif', size: 12, weight: '600' },
            boxWidth: 14,
            boxHeight: 14,
            borderRadius: 3
          }
        },
        tooltip: {
          backgroundColor: 'rgba(8, 18, 23, 0.95)',
          borderColor:     'rgba(0, 229, 255, 0.2)',
          borderWidth: 1,
          titleColor:  '#c9e8f0',
          bodyColor:   '#8ab8c4',
          padding: 12,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, 2)}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color:  'var(--text3)',
            font:   { family: 'Rajdhani, sans-serif', size: 11 }
          },
          grid: { color: 'rgba(0, 229, 255, 0.04)' }
        },
        y: {
          ticks: {
            color: 'var(--text3)',
            font:  { family: 'Rajdhani, sans-serif', size: 11 }
          },
          grid:  { color: 'rgba(0, 229, 255, 0.05)' },
          beginAtZero: true
        }
      }
    }
  });
}

/* ============================================================
   RENDER COMPARISON TABLE
   ============================================================ */
function renderComparisonTable(a, b) {
  const tbody = document.getElementById('compare-tbody');
  if (!tbody) return;

  const metrics = [
    {
      label:   'Eficiencia',
      unit:    '%',
      valA:    a.efficiency,
      valB:    b.efficiency,
      fmt:     (v) => `${formatNumber(v, 1)}%`,
      higher:  true   // Mayor es mejor
    },
    {
      label:   'CO₂ reducido',
      unit:    'kg',
      valA:    a.co2_reduced,
      valB:    b.co2_reduced,
      fmt:     (v) => `${formatNumber(v, 0)} kg`,
      higher:  true
    },
    {
      label:   'Costo total',
      unit:    'S/',
      valA:    a.total_cost,
      valB:    b.total_cost,
      fmt:     (v) => `S/ ${formatNumber(v, 0)}`,
      higher:  false  // Menor es mejor
    },
    {
      label:   'Ahorro',
      unit:    'S/',
      valA:    a.savings,
      valB:    b.savings,
      fmt:     (v) => `S/ ${formatNumber(v, 0)}`,
      higher:  true
    },
    {
      label:   'Demanda pico',
      unit:    'kW',
      valA:    a.peak_demand,
      valB:    b.peak_demand,
      fmt:     (v) => `${formatNumber(v, 1)} kW`,
      higher:  false
    },
    {
      label:   'Energía solar',
      unit:    '%',
      valA:    a.solar_share   ?? 60,
      valB:    b.solar_share   ?? 55,
      fmt:     (v) => `${formatNumber(v, 0)}%`,
      higher:  true
    },
    {
      label:   'Capacidad batería',
      unit:    'kWh',
      valA:    a.battery_capacity ?? 80,
      valB:    b.battery_capacity ?? 200,
      fmt:     (v) => `${formatNumber(v, 0)} kWh`,
      higher:  true
    },
    {
      label:   'Nodos conectados',
      unit:    '',
      valA:    a.nodes,
      valB:    b.nodes,
      fmt:     (v) => formatNumber(v, 0),
      higher:  true
    }
  ];

  tbody.innerHTML = metrics.map(m => {
    // Determinar cuál es mejor
    const aWins = m.higher ? m.valA >= m.valB : m.valA <= m.valB;
    const bWins = m.higher ? m.valB >  m.valA : m.valB <  m.valA;
    const tie   = m.valA === m.valB;

    const classA   = tie ? '' : (aWins ? 'winner' : 'loser');
    const classB   = tie ? '' : (bWins ? 'winner' : 'loser');
    const bestName = tie
      ? '<span style="color:var(--text3)">Empate</span>'
      : aWins
        ? `<span class="best-cell" style="color:var(--cyan)"><i data-lucide="check"></i>Escenario A</span>`
        : `<span class="best-cell" style="color:#7c3aed"><i data-lucide="check"></i>Escenario B</span>`;

    return `
      <tr>
        <td>${escapeHtml(m.label)}</td>
        <td class="${classA}">${m.fmt(m.valA)}</td>
        <td class="${classB}">${m.fmt(m.valB)}</td>
        <td>${bestName}</td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

/* ============================================================
   HELPER: setText
   ============================================================ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
