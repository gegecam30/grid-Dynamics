/* ============================================
   GRID DYNAMICS — Results Page JS
   Renders 3 Chart.js charts and KPI data from
   MOCK.simulationResult. Renders alerts panel.
   ============================================ */

// Guard
if (typeof requireAuth === 'function') requireAuth('../pages/login.html');

/* ── Shared Chart.js defaults ── */
const CHART_TOOLTIP = {
  backgroundColor: 'rgba(8,18,23,0.95)',
  borderColor:     'rgba(0,229,255,0.2)',
  borderWidth:     1,
  titleColor:      '#c9e8f0',
  bodyColor:       '#8ab8c4',
  padding:         12,
  cornerRadius:    6
};

const CHART_GRID_COLOR  = 'rgba(0,229,255,0.05)';
const CHART_TICK_COLOR  = '#4a7a8a';
const CHART_TICK_FONT   = { size: 10, family: "'Share Tech Mono', monospace" };

/* ── Donut colors ── */
const DONUT_COLORS = ['#00e5ff', '#7c3aed', '#ffa000', '#ff3250'];

/* -------------------------------------------------- */
/*  Page Init                                          */
/* -------------------------------------------------- */
async function initResultsPage() {
  try {
    const result = await fetchOrMock(ENDPOINTS.simResult?.('s-001') || ENDPOINTS.simulate, MOCK.simulationResult);
    renderKPIs(result);
    renderLineChart(result.hourly);
    renderDonutChart(result.distribution);
    renderBarChart(result.hourly);
    renderAlerts(result.alerts);
    updateProjectBadge(result);
  } catch (err) {
    console.error('[results] Error cargando resultados:', err);
    showToast('Error al cargar los resultados de simulación', 'error');
  }
}

/* -------------------------------------------------- */
/*  KPI rendering                                      */
/* -------------------------------------------------- */
function renderKPIs(result) {
  const setKPI = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setKPI('kpi-efficiency-val', formatNumber(result.efficiency, 1));
  setKPI('kpi-co2-val',        formatNumber(result.co2_reduced, 0));
  setKPI('kpi-cost-val',       formatNumber(result.total_cost, 0));
  setKPI('kpi-savings-val',    formatNumber(result.savings, 0));

  lucide.createIcons();
}

/* -------------------------------------------------- */
/*  Project badge                                      */
/* -------------------------------------------------- */
function updateProjectBadge(result) {
  const nameEl = document.getElementById('res-project-name');
  const idEl   = document.getElementById('res-sim-id');
  if (nameEl && result.project_name) nameEl.textContent = escapeHtml(result.project_name);
  if (idEl   && result.id)           idEl.textContent   = escapeHtml(result.id);
}

/* -------------------------------------------------- */
/*  Line Chart: Consumo vs Generación (24h)            */
/* -------------------------------------------------- */
function renderLineChart(hourly) {
  const ctx = document.getElementById('line-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: hourly.labels,
      datasets: [
        {
          label: 'Generación (kWh)',
          data: hourly.generation,
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0,229,255,0.07)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#00e5ff'
        },
        {
          label: 'Consumo (kWh)',
          data: hourly.consumption,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.07)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#7c3aed'
        },
        {
          label: 'Batería (kWh)',
          data: hourly.battery,
          borderColor: '#ffa000',
          backgroundColor: 'rgba(255,160,0,0.05)',
          fill: false,
          tension: 0.4,
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#ffa000'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend:  { display: false },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} kWh`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: CHART_TICK_COLOR,
            font: CHART_TICK_FONT,
            maxTicksLimit: 12
          },
          grid: { color: CHART_GRID_COLOR }
        },
        y: {
          ticks: {
            color: CHART_TICK_COLOR,
            font: CHART_TICK_FONT,
            callback: val => `${val} kWh`
          },
          grid: { color: CHART_GRID_COLOR }
        }
      }
    }
  });
}

/* -------------------------------------------------- */
/*  Donut Chart: Distribución de Energía               */
/* -------------------------------------------------- */
function renderDonutChart(distribution) {
  const ctx = document.getElementById('donut-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels:   distribution.labels,
      datasets: [{
        data:            distribution.values,
        backgroundColor: DONUT_COLORS.map(c => c + 'cc'),  // slight transparency
        borderColor:     DONUT_COLORS,
        borderWidth:     2,
        hoverOffset:     8
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}%`
          }
        }
      }
    }
  });

  // Render custom legend
  const legendEl = document.getElementById('donut-legend');
  if (legendEl) {
    legendEl.innerHTML = distribution.labels.map((lbl, i) => `
      <div class="donut-legend-item">
        <div class="donut-legend-dot" style="background:${DONUT_COLORS[i]}"></div>
        <span>${escapeHtml(lbl)}</span>
        <span class="donut-legend-val">${distribution.values[i]}%</span>
      </div>`).join('');
  }
}

/* -------------------------------------------------- */
/*  Bar Chart: Comparación por Hora (grouped, 6 bins)  */
/* -------------------------------------------------- */
function renderBarChart(hourly) {
  const ctx = document.getElementById('bar-chart');
  if (!ctx) return;

  // Group 24 hourly values into 6 segments of 4h each
  const GROUPS  = 6;
  const SIZE    = hourly.labels.length / GROUPS; // 4
  const labels  = [];
  const consArr = [];
  const genArr  = [];

  for (let g = 0; g < GROUPS; g++) {
    const start = g * SIZE;
    const end   = start + SIZE;
    labels.push(`${hourly.labels[start]}–${hourly.labels[end - 1]}`);

    const sumConsumption = hourly.consumption.slice(start, end).reduce((a, b) => a + b, 0);
    const sumGeneration  = hourly.generation.slice(start, end).reduce((a, b) => a + b, 0);
    consArr.push(Math.round(sumConsumption));
    genArr.push(Math.round(sumGeneration));
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Generación (kWh)',
          data:  genArr,
          backgroundColor: 'rgba(0,229,255,0.55)',
          borderColor:     '#00e5ff',
          borderWidth:     1,
          borderRadius:    4,
          borderSkipped:   false
        },
        {
          label: 'Consumo (kWh)',
          data:  consArr,
          backgroundColor: 'rgba(124,58,237,0.55)',
          borderColor:     '#7c3aed',
          borderWidth:     1,
          borderRadius:    4,
          borderSkipped:   false
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} kWh`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: CHART_TICK_COLOR,
            font: CHART_TICK_FONT
          },
          grid: { color: CHART_GRID_COLOR }
        },
        y: {
          ticks: {
            color: CHART_TICK_COLOR,
            font: CHART_TICK_FONT,
            callback: val => `${val} kWh`
          },
          grid: { color: CHART_GRID_COLOR }
        }
      }
    }
  });
}

/* -------------------------------------------------- */
/*  Alerts Panel                                       */
/* -------------------------------------------------- */
function renderAlerts(alerts) {
  const panel = document.getElementById('alerts-panel');
  const countEl = document.getElementById('alerts-count');
  if (!panel) return;

  if (!alerts || !alerts.length) {
    panel.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8) 0">
        <div class="empty-state-icon"><i data-lucide="check-circle-2"></i></div>
        <p style="color:var(--text3)">Sin alertas para esta simulación.</p>
      </div>`;
    if (countEl) countEl.textContent = '0 alertas';
    lucide.createIcons();
    return;
  }

  if (countEl) {
    const plural = alerts.length === 1 ? 'alerta' : 'alertas';
    countEl.textContent = `${alerts.length} ${plural}`;
    // Update badge class
    countEl.className = `badge ${alerts.some(a => a.type === 'error') ? 'badge-error' : 'badge-warn'}`;
  }

  const iconMap = {
    warn:    'alert-triangle',
    error:   'x-circle',
    info:    'info',
    success: 'check-circle-2'
  };

  panel.innerHTML = alerts.map(alert => `
    <div class="alert-item ${escapeHtml(alert.type)}" role="alert">
      <i data-lucide="${iconMap[alert.type] || 'info'}"></i>
      <div class="alert-item-content">
        <div class="alert-item-title">${escapeHtml(alert.title)}</div>
        <div class="alert-item-desc">${escapeHtml(alert.desc)}</div>
      </div>
    </div>`).join('');

  lucide.createIcons();
}
