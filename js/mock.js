/* ============================================
   GRID DYNAMICS — Mock Data
   Datos demo para uso local/desarrollo.
   Cuando el backend esté disponible, cada página
   llama a la API primero y usa estos datos como
   fallback si el servidor no responde.
   ============================================ */

const MOCK = {

  /* ---------- Dashboard ---------- */
  dashboard: {
    total_projects: 7,
    total_simulations: 23,
    co2_reduced: 4820,
    total_profiles: 5,
    trends: {
      projects:    '+2 este mes',
      simulations: '+8 este mes',
      co2:         '+12.4%',
      profiles:    'Sin cambios'
    }
  },

  /* ---------- Proyectos ---------- */
  projects: {
    results: [
      {
        id: 'p-001',
        name: 'Microrred Lomas de Carabayllo',
        description: 'Red híbrida solar-batería para 48 viviendas. Fase piloto iniciada.',
        status: 'running',
        nodes: 12,
        last_simulation: '2026-06-04',
        created_at: '2026-04-15'
      },
      {
        id: 'p-002',
        name: 'Condominio Las Gardenias',
        description: 'Optimización de consumo nocturno con baterías de ion-litio.',
        status: 'completed',
        nodes: 8,
        last_simulation: '2026-05-28',
        created_at: '2026-03-02'
      },
      {
        id: 'p-003',
        name: 'Urbanización El Olivar',
        description: 'Análisis de factibilidad para instalación de 60 kWp solar.',
        status: 'draft',
        nodes: 5,
        last_simulation: null,
        created_at: '2026-06-01'
      },
      {
        id: 'p-004',
        name: 'Residencial Torre Norte',
        description: 'Red de carga vehicular + paneles en azotea.',
        status: 'pending',
        nodes: 20,
        last_simulation: '2026-06-03',
        created_at: '2026-02-18'
      },
      {
        id: 'p-005',
        name: 'Parque Industrial San Juan',
        description: 'Microrred industrial con aerogeneradores y respaldo de red.',
        status: 'error',
        nodes: 31,
        last_simulation: '2026-05-15',
        created_at: '2026-01-10'
      },
      {
        id: 'p-006',
        name: 'Villa El Sol - Fase 2',
        description: 'Expansión de microrred existente a 90 viviendas.',
        status: 'draft',
        nodes: 3,
        last_simulation: null,
        created_at: '2026-06-05'
      },
      {
        id: 'p-007',
        name: 'Municipalidad Surco — Demo',
        description: 'Proyecto demostrativo para presentación municipal.',
        status: 'completed',
        nodes: 15,
        last_simulation: '2026-06-02',
        created_at: '2026-05-20'
      }
    ]
  },

  /* ---------- Simulaciones ---------- */
  simulations: {
    results: [
      {
        id: 's-001',
        project_id: 'p-001',
        project_name: 'Lomas de Carabayllo',
        status: 'completed',
        duration_hours: 24,
        demand_type: 'residential',
        efficiency: 87.3,
        co2_reduced: 342,
        total_cost: 18400,
        savings: 2860,
        created_at: '2026-06-04T14:30:00Z'
      },
      {
        id: 's-002',
        project_id: 'p-002',
        project_name: 'Las Gardenias',
        status: 'completed',
        duration_hours: 48,
        demand_type: 'residential',
        efficiency: 91.7,
        co2_reduced: 218,
        total_cost: 12200,
        savings: 3100,
        created_at: '2026-05-28T09:15:00Z'
      },
      {
        id: 's-003',
        project_id: 'p-004',
        project_name: 'Torre Norte',
        status: 'completed',
        duration_hours: 72,
        demand_type: 'commercial',
        efficiency: 78.5,
        co2_reduced: 560,
        total_cost: 45800,
        savings: 7200,
        created_at: '2026-06-03T16:00:00Z'
      }
    ]
  },

  /* ---------- Resultado de simulación (24h) ---------- */
  simulationResult: {
    id: 's-001',
    project_name: 'Lomas de Carabayllo',
    efficiency: 87.3,
    co2_reduced: 342,
    total_cost: 18400,
    savings: 2860,
    peak_demand: 42.5,
    // 24 puntos horarios
    hourly: {
      labels: ['00h','01h','02h','03h','04h','05h','06h','07h','08h','09h','10h','11h',
               '12h','13h','14h','15h','16h','17h','18h','19h','20h','21h','22h','23h'],
      consumption: [18,15,13,12,12,14,22,35,44,48,45,42,38,36,40,44,46,50,55,62,58,48,38,25],
      generation:  [0,0,0,0,0,2,12,28,40,52,60,64,68,65,62,58,48,35,18,4,0,0,0,0],
      battery:     [0,0,0,0,0,0,5,8,10,12,14,16,18,18,16,14,10,8,5,2,0,0,0,0]
    },
    // Distribución de energía (donut)
    distribution: {
      labels: ['Solar', 'Red Eléctrica', 'Batería', 'Pérdidas'],
      values: [62, 21, 12, 5]
    },
    alerts: [
      { type: 'warn', title: 'Pico de demanda detectado', desc: 'A las 19h se superó el límite óptimo de 55 kWh. Considera aumentar la capacidad de batería.' },
      { type: 'info', title: 'Generación solar óptima', desc: 'El rendimiento solar de 12:00-14:00 fue superior al promedio regional en un 8%.' },
      { type: 'success', title: 'Balance energético positivo', desc: 'La red generó 14% más energía de la consumida. Excedente aprovechable: 38 kWh.' }
    ]
  },

  /* ---------- Perfiles de demanda ---------- */
  profiles: {
    results: [
      {
        id: 'pf-001',
        name: 'Perfil Residencial Estándar',
        rows: 8760,
        columns: ['timestamp', 'consumption_kwh', 'peak_flag'],
        status: 'valid',
        uploaded_at: '2026-05-10',
        project_count: 3
      },
      {
        id: 'pf-002',
        name: 'Perfil Comercial Surco',
        rows: 4380,
        columns: ['timestamp', 'consumption_kwh', 'peak_flag', 'sector'],
        status: 'valid',
        uploaded_at: '2026-05-22',
        project_count: 1
      },
      {
        id: 'pf-003',
        name: 'Demanda Industrial Q1',
        rows: 2190,
        columns: ['timestamp', 'consumo', 'pico'],
        status: 'error',
        error: 'Columna "consumo" debe llamarse "consumption_kwh"',
        uploaded_at: '2026-06-01',
        project_count: 0
      }
    ]
  },

  /* ---------- Escenarios para comparación ---------- */
  scenarios: {
    comparison: {
      scenario_a: {
        id: 's-001',
        name: 'Lomas de Carabayllo — 24h',
        efficiency: 87.3,
        co2_reduced: 342,
        total_cost: 18400,
        savings: 2860,
        peak_demand: 42.5,
        solar_share: 62,
        battery_capacity: 80,
        nodes: 12
      },
      scenario_b: {
        id: 's-003',
        name: 'Torre Norte — 72h',
        efficiency: 78.5,
        co2_reduced: 560,
        total_cost: 45800,
        savings: 7200,
        peak_demand: 68.2,
        solar_share: 55,
        battery_capacity: 200,
        nodes: 20
      }
    }
  },

  /* ---------- Activity feed (dashboard) ---------- */
  activity: [
    { type: 'simulation', icon: 'zap',         msg: 'Simulación completada — Lomas de Carabayllo',  time: 'Hace 2h' },
    { type: 'project',    icon: 'folder-plus',  msg: 'Nuevo proyecto creado — Villa El Sol Fase 2',  time: 'Hace 5h' },
    { type: 'profile',    icon: 'file-up',      msg: 'CSV cargado — Perfil Comercial Surco',         time: 'Ayer' },
    { type: 'alert',      icon: 'alert-triangle', msg: 'Alerta en Torre Norte — Pico de demanda',    time: '2 días' }
  ]
};

/* ============================================================
   Helper: intenta la API, cae en mock si falla o DEV_MODE
   Uso: const data = await fetchOrMock(ENDPOINTS.projects, MOCK.projects);
   ============================================================ */
async function fetchOrMock(url, mockData, options = {}) {
  // Si no hay token en DEV_MODE ya usa mock directo
  if (typeof DEV_MODE !== 'undefined' && DEV_MODE) {
    await new Promise(r => setTimeout(r, 600)); // simula latencia
    console.info('[GridDynamics] DEV_MODE — usando datos mock para:', url);
    return mockData;
  }
  try {
    return await apiGet(url);
  } catch (_) {
    console.info('[GridDynamics] API no disponible, usando mock para:', url);
    return mockData;
  }
}
