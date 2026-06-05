/* ============================================
   GRID DYNAMICS — Configuración central de API
   ============================================ */

const API_BASE = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''
) ? 'http://127.0.0.1:8000' : 'https://api.griddynamics.app';

const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';

const ENDPOINTS = {
  login:       `${API_BASE}/api/auth/login`,
  register:    `${API_BASE}/api/auth/register`,
  logout:      `${API_BASE}/api/auth/logout`,
  me:          `${API_BASE}/api/auth/me`,
  projects:    `${API_BASE}/api/projects`,
  project:     (id) => `${API_BASE}/api/projects/${id}`,
  topology:    (id) => `${API_BASE}/api/projects/${id}/topology`,
  simulate:    `${API_BASE}/api/simulations`,
  simResult:   (id) => `${API_BASE}/api/simulations/${id}`,
  compare:     `${API_BASE}/api/simulations/compare`,
  profiles:    `${API_BASE}/api/profiles`,
  uploadCSV:   `${API_BASE}/api/profiles/upload`,
  dashboard:   `${API_BASE}/api/dashboard/stats`,
};