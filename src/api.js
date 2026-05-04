/**
 * JiraPulse API Client – connects frontend to FastAPI backend.
 * Falls back to mock data if backend is unavailable.
 */

const API_BASE = 'http://localhost:8000/api';
let backendAvailable = null;

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    backendAvailable = true;
    return await res.json();
  } catch (err) {
    if (backendAvailable === null) backendAvailable = false;
    console.warn(`API call failed (${path}):`, err.message);
    return null;
  }
}

// ── Health ──
export async function checkHealth() {
  return await apiFetch('/health');
}

// ── Employees ──
export async function fetchEmployees() {
  return await apiFetch('/employees');
}

export async function fetchEmployeeDetail(empId) {
  return await apiFetch(`/employees/${empId}`);
}

// ── Sprints ──
export async function fetchSprints() {
  return await apiFetch('/sprints');
}

// ── Issues ──
export async function fetchIssues(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await apiFetch(`/issues?${query}`);
}

// ── Analytics ──
export async function fetchDashboard() {
  return await apiFetch('/analytics/dashboard');
}

export async function fetchLeaderboard() {
  return await apiFetch('/analytics/leaderboard');
}

export async function fetchComparison(empAId, empBId) {
  return await apiFetch(`/analytics/comparison?emp_a=${empAId}&emp_b=${empBId}`);
}

export async function fetchWorkload() {
  return await apiFetch('/analytics/workload');
}

export async function fetchTimeline(limit = 30) {
  return await apiFetch(`/analytics/timeline?limit=${limit}`);
}

export async function fetchTeamOverview() {
  return await apiFetch('/analytics/team');
}

// ── Sync ──
export async function triggerSync() {
  return await apiFetch('/sync', { method: 'POST' });
}

// ── Config ──
export async function updateConfig(config) {
  return await apiFetch('/config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// ── Export ──
export function getExportUrl(type) {
  return `${API_BASE}/export/${type}`;
}

// ── Status ──
export function isBackendAvailable() {
  return backendAvailable === true;
}
