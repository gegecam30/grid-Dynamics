/* ============================================
   GRID DYNAMICS — Landing Interactividad
   ============================================ */

// Mobile menu toggle
(function () {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const isHidden = menu.hasAttribute('hidden');
    if (isHidden) {
      menu.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      menu.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  // Cierra al hacer click en un link
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Módulos interactivos
(function () {
  const moduleData = {
    topology: {
      icon: 'ph-graph',
      title: 'Gestión de Microrred',
      desc: 'Diseña topologías de red mediante un editor visual interactivo. Agrega viviendas, paneles solares, baterías y fuentes externas mediante drag & drop.',
      features: [
        'Editor de nodos con propiedades eléctricas',
        'Configuración de consumo (kWh), generación y almacenamiento',
        'CRUD completo de configuraciones',
        'Importación de perfiles CSV'
      ]
    },
    simulation: {
      icon: 'ph-lightning',
      title: 'Motor de Simulación',
      desc: 'Ejecuta simulaciones de flujo de energía en tiempo real o escenarios definidos. El motor procesa el balance energético con latencia menor a 3 segundos.',
      features: [
        'Simulación hora a hora por 24h o más',
        'Escenarios de alta demanda o baja generación',
        'Cálculo asíncrono para topologías grandes',
        'Integración con datos climáticos históricos'
      ]
    },
    analytics: {
      icon: 'ph-chart-bar',
      title: 'Análisis y Resultados',
      desc: 'Visualiza el balance energético con gráficas interactivas. Compara múltiples escenarios e identifica ineficiencias automáticamente.',
      features: [
        'Gráficas de consumo vs. generación',
        'Indicadores: costo, eficiencia y emisiones CO₂',
        'Comparación de escenarios lado a lado',
        'Alertas automáticas de pérdidas críticas'
      ]
    },
    users: {
      icon: 'ph-users',
      title: 'Gestión de Usuarios',
      desc: 'Sistema de autenticación seguro con roles para ingenieros eléctricos, consultores y administradores de condominios.',
      features: [
        'Registro e inicio de sesión seguros (JWT)',
        'Roles: Ingeniero, Consultor, Administrador',
        'Datos cifrados en Supabase',
        'Sesiones protegidas con tokens de refresco'
      ]
    }
  };

  const btns = document.querySelectorAll('.module-item');
  const detail = document.getElementById('module-detail');
  if (!btns.length || !detail) return;

  function renderModule(key) {
    const d = moduleData[key];
    if (!d) return;
    detail.innerHTML = `
      <div class="module-detail-content">
        <h3><i class="ph-duotone ${d.icon}" aria-hidden="true"></i> ${d.title}</h3>
        <p>${d.desc}</p>
        <ul role="list" class="module-features-list">
          ${d.features.map(f => `<li><i class="ph-duotone ph-check-circle" aria-hidden="true"></i>${f}</li>`).join('')}
        </ul>
      </div>`;
    if (window.PhosphorIcons) window.PhosphorIcons.refresh?.();
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      renderModule(btn.dataset.module);
    });
  });
})();

// Navbar sticky estilo
(function () {
  const nav = document.querySelector('.landing-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.style.borderBottomColor = window.scrollY > 10
      ? 'var(--border)'
      : 'transparent';
  }, { passive: true });
})();

// Animación de entrada para los elementos al scroll
(function () {
  if (!('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll('.feature-card, .kpi-card, .team-member, .pillar, .stat-item');
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;
  });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
})();