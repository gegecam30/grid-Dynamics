/* ============================================
   GRID DYNAMICS — Editor de Topología (Canvas)
   Conectar con: GET/POST/PUT /api/projects/:id/topology
   ============================================ */
requireAuth?.();

const canvas = document.getElementById('topology-canvas');
const ctx = canvas?.getContext('2d');

// Estado del editor
let nodes = [];
let connections = [];
let selectedNode = null;
let tool = 'select'; // 'select' | 'connect' | 'delete'
let connectFrom = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let scale = 1;
let offset = { x: 0, y: 0 };
let projectId = new URLSearchParams(location.search).get('id');

// Iconos ASCII por tipo (reemplazable con sprites cuando el backend entregue imágenes)
const NODE_COLORS = {
  house:   '#00bcd4',
  solar:   '#ffa000',
  battery: '#00e564',
  grid:    '#8ab8c4',
  wind:    '#4dd0e1',
  load:    '#ff3250',
};
const NODE_LABELS = {
  house:   'VIVIENDA',
  solar:   'SOLAR',
  battery: 'BATERÍA',
  grid:    'RED',
  wind:    'VIENTO',
  load:    'CARGA',
};

function resizeCanvas() {
  if (!canvas) return;
  const wrap = document.getElementById('canvas-container');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  draw();
}

function worldToScreen(wx, wy) {
  return { x: wx * scale + offset.x, y: wy * scale + offset.y };
}
function screenToWorld(sx, sy) {
  return { x: (sx - offset.x) / scale, y: (sy - offset.y) / scale };
}

function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo con grid
  ctx.fillStyle = '#050a0d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid cyberpunk
  ctx.strokeStyle = 'rgba(0,229,255,0.05)';
  ctx.lineWidth = 1;
  const gridSize = 40 * scale;
  const startX = offset.x % gridSize;
  const startY = offset.y % gridSize;
  for (let x = startX; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = startY; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Conexiones
  connections.forEach(conn => {
    const from = nodes.find(n => n.id === conn.from);
    const to   = nodes.find(n => n.id === conn.to);
    if (!from || !to) return;
    const fs = worldToScreen(from.x, from.y);
    const ts = worldToScreen(to.x, to.y);
    ctx.beginPath();
    ctx.moveTo(fs.x, fs.y);
    ctx.lineTo(ts.x, ts.y);
    ctx.strokeStyle = 'rgba(0,229,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Nodos
  nodes.forEach(node => {
    const s = worldToScreen(node.x, node.y);
    const r = 22 * scale;
    const color = NODE_COLORS[node.type] || '#00e5ff';
    const isSelected = selectedNode?.id === node.id;

    // Sombra/glow
    if (isSelected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
    }

    // Círculo del nodo
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0a1a20';
    ctx.fill();
    ctx.strokeStyle = isSelected ? color : `${color}99`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Letra del tipo
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.max(9, 11 * scale)}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(NODE_LABELS[node.type]?.[0] || '?', s.x, s.y);

    // Label debajo
    ctx.fillStyle = '#8ab8c4';
    ctx.font = `${Math.max(8, 9 * scale)}px Rajdhani, sans-serif`;
    ctx.fillText(node.name || NODE_LABELS[node.type] || node.type, s.x, s.y + r + 12 * scale);
  });
}

// Obtener nodo en posición
function getNodeAt(sx, sy) {
  const w = screenToWorld(sx, sy);
  return nodes.slice().reverse().find(n => {
    const dx = n.x - w.x, dy = n.y - w.y;
    return Math.sqrt(dx*dx + dy*dy) < 26;
  });
}

// Mouse events
canvas?.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
  const hit = getNodeAt(sx, sy);

  if (tool === 'select') {
    if (hit) {
      selectedNode = hit;
      isDragging = true;
      const s = worldToScreen(hit.x, hit.y);
      dragOffset = { x: sx - s.x, y: sy - s.y };
      showNodeProps(hit);
    } else {
      selectedNode = null;
      hideNodeProps();
    }
  } else if (tool === 'connect') {
    if (hit) {
      if (!connectFrom) {
        connectFrom = hit;
      } else if (connectFrom.id !== hit.id) {
        const exists = connections.some(c =>
          (c.from === connectFrom.id && c.to === hit.id) ||
          (c.from === hit.id && c.to === connectFrom.id));
        if (!exists) connections.push({ from: connectFrom.id, to: hit.id });
        connectFrom = null;
      }
    }
  } else if (tool === 'delete') {
    if (hit) {
      nodes = nodes.filter(n => n.id !== hit.id);
      connections = connections.filter(c => c.from !== hit.id && c.to !== hit.id);
      if (selectedNode?.id === hit.id) { selectedNode = null; hideNodeProps(); }
    }
  }
  draw();
});

canvas?.addEventListener('mousemove', e => {
  if (!isDragging || !selectedNode || tool !== 'select') return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left - dragOffset.x;
  const sy = e.clientY - rect.top - dragOffset.y;
  const w = screenToWorld(sx, sy);
  selectedNode.x = w.x; selectedNode.y = w.y;
  draw();
});
canvas?.addEventListener('mouseup', () => { isDragging = false; });
canvas?.addEventListener('mouseleave', () => { isDragging = false; });

// Herramientas
document.querySelectorAll('.editor-tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.id;
    if (id === 'tool-clear') { if (confirm('¿Limpiar todo el canvas?')) { nodes = []; connections = []; selectedNode = null; hideNodeProps(); draw(); } return; }
    if (id === 'tool-zoom-in') { scale = Math.min(scale * 1.2, 3); draw(); return; }
    if (id === 'tool-zoom-out') { scale = Math.max(scale / 1.2, 0.3); draw(); return; }
    document.querySelectorAll('.editor-tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tool = id.replace('tool-', '');
    connectFrom = null;
  });
});

// Drag desde paleta
document.querySelectorAll('.palette-item').forEach(item => {
  item.addEventListener('dragstart', e => {
    e.dataTransfer.setData('node-type', item.dataset.type);
  });
});
canvas?.addEventListener('dragover', e => e.preventDefault());
canvas?.addEventListener('drop', e => {
  e.preventDefault();
  const type = e.dataTransfer.getData('node-type');
  if (!type) return;
  const rect = canvas.getBoundingClientRect();
  const w = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  const node = {
    id: crypto.randomUUID(),
    type, name: NODE_LABELS[type] || type,
    x: w.x, y: w.y,
    consumption: 0, capacity: 0, storage: 0, cost: 0
  };
  nodes.push(node);
  draw();
  showToast(`Nodo ${NODE_LABELS[type]} agregado`, 'success');
});

// Panel de propiedades
function showNodeProps(node) {
  document.getElementById('props-empty').hidden = true;
  document.getElementById('node-props-form').hidden = false;
  document.getElementById('node-name').value = node.name || '';
  document.getElementById('node-consumption').value = node.consumption || 0;
  document.getElementById('node-capacity').value = node.capacity || 0;
  document.getElementById('node-storage').value = node.storage || 0;
  document.getElementById('node-cost').value = node.cost || 0;
}
function hideNodeProps() {
  document.getElementById('props-empty').hidden = false;
  document.getElementById('node-props-form').hidden = true;
}

document.getElementById('save-node-btn')?.addEventListener('click', () => {
  if (!selectedNode) return;
  selectedNode.name = document.getElementById('node-name').value;
  selectedNode.consumption = parseFloat(document.getElementById('node-consumption').value) || 0;
  selectedNode.capacity = parseFloat(document.getElementById('node-capacity').value) || 0;
  selectedNode.storage = parseFloat(document.getElementById('node-storage').value) || 0;
  selectedNode.cost = parseFloat(document.getElementById('node-cost').value) || 0;
  draw();
  showToast('Propiedades guardadas', 'success');
});

document.getElementById('delete-node-btn')?.addEventListener('click', () => {
  if (!selectedNode) return;
  nodes = nodes.filter(n => n.id !== selectedNode.id);
  connections = connections.filter(c => c.from !== selectedNode.id && c.to !== selectedNode.id);
  selectedNode = null; hideNodeProps(); draw();
  showToast('Nodo eliminado', 'info');
});

// Guardar topología en backend
document.getElementById('save-topology-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('save-topology-btn');
  setButtonLoading(btn, true, 'Guardando...');
  try {
    const pid = projectId || 'new';
    await apiPost(ENDPOINTS.topology(pid), { nodes, connections });
    showToast('Topología guardada', 'success');
  } catch (err) {
    showToast(err.message || 'Error al guardar', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

// Init
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Cargar topología si hay project ID
if (projectId) {
  (async () => {
    try {
      const data = await apiGet(ENDPOINTS.topology(projectId));
      nodes = data.nodes || [];
      connections = data.connections || [];
      draw();
    } catch (_) {}
  })();
}