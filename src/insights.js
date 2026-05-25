// ──────────────────────────────────────────────
// Insights Views – Performance Reviews & Bug Quality
// ──────────────────────────────────────────────
import { employees, teams, departments, sprints, allIssues, getOverallMetrics } from './data.js';
import { calcProductivityScore } from './features.js';

const avatarColors = ['#6C5CE7','#00B4D8','#00C9A7','#FFB347','#FF6B8A','#A78BFA','#F97316','#14B8A6','#EC4899','#8B5CF6','#06B6D4','#10B981'];
function getColor(i) { return avatarColors[i % avatarColors.length]; }
function kpi(label, value, icon, colorVar, trend, dir) {
  return `<div class="kpi-card"><div class="kpi-glow" style="background:var(${colorVar})"></div><div class="kpi-icon" style="background:var(${colorVar})18;color:var(${colorVar})">${icon}</div><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-trend ${dir}"><span>${dir === 'up' ? '↑' : dir === 'down' ? '↓' : '•'}</span> ${trend}</div></div>`;
}

function sparkline(values) {
  if (!values.length) return '';
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const w = 80, h = 24, pad = 2;
  const range = max - min || 1;
  const pts = values.map((v, i) => `${pad + i * ((w - 2 * pad) / Math.max(values.length - 1, 1))},${pad + (1 - (v - min) / range) * (h - 2 * pad)}`).join(' ');
  const last = values[values.length - 1], prev = values.length > 1 ? values[values.length - 2] : last;
  const color = last >= prev ? 'var(--green)' : 'var(--rose)';
  return `<svg width="${w}" height="${h}" style="vertical-align:middle"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

function getBand(score) {
  if (score > 75) return { label: 'Top Performer', cls: 'top' };
  if (score > 50) return { label: 'Meets Expectations', cls: 'meets' };
  return { label: 'Needs Improvement', cls: 'needs' };
}

function getSprintVelocities(empId) {
  return sprints.map(s => allIssues.filter(i => i.assignee === empId && i.sprint === s.id && i.status === 'Done').reduce((sum, i) => sum + i.storyPoints, 0));
}

// ── Performance Reviews ──
export function renderPerformanceReview(teamId) {
  const tid = teamId || teams[0].id;
  const team = teams.find(t => t.id === tid);
  const members = employees.filter(e => e.teamId === tid);
  const teamOpts = teams.map(t => `<option value="${t.id}" ${t.id === tid ? 'selected' : ''}>${t.name}</option>`).join('');

  const cards = members.map(emp => {
    const idx = employees.indexOf(emp);
    const score = calcProductivityScore(emp.id);
    const m = getOverallMetrics(emp.id);
    const velocities = getSprintVelocities(emp.id);
    const band = getBand(score.total);
    const bandColor = band.cls === 'top' ? 'var(--green)' : band.cls === 'meets' ? 'var(--amber)' : 'var(--rose)';
    return `<div class="workload-card" data-emp="${emp.id}">
      <div class="flex items-center gap-3">
        <div class="emp-avatar" style="background:${getColor(idx)};width:40px;height:40px;font-size:.8rem">${emp.avatar}</div>
        <div><div style="font-weight:600">${emp.name}</div><div style="font-size:.7rem;color:var(--text-secondary)">${emp.role}</div></div>
      </div>
      <div class="workload-stats" style="margin-top:10px">
        <div class="wl-stat"><span class="wl-val" style="color:${score.total >= 75 ? 'var(--green)' : score.total >= 50 ? 'var(--amber)' : 'var(--rose)'}">${score.total}</span><span class="wl-label">Score</span></div>
        <div class="wl-stat"><span class="wl-val">${sparkline(velocities.slice(-6))}</span><span class="wl-label">Velocity</span></div>
        <div class="wl-stat"><span class="wl-val">${m.completionRate}%</span><span class="wl-label">Completion</span></div>
      </div>
      <div style="margin-top:8px;text-align:center"><span style="font-size:.7rem;font-weight:600;padding:3px 10px;border-radius:12px;background:${bandColor}18;color:${bandColor}">${band.label}</span></div>
    </div>`;
  }).join('');

  return `<div class="section-header"><h2>📈 Performance Reviews</h2>
    <select id="perfTeamSelect" class="comp-select" style="max-width:250px">${teamOpts}</select></div>
  <div class="retro-sprint-info"><h3>${team?.name || ''}</h3><p>${members.length} team members · ${departments.find(d => d.id === team?.dept)?.name || ''}</p></div>
  <div class="workload-grid mt-4">${cards}</div>`;
}

export function getPerformanceData(teamId) {
  const tid = teamId || teams[0].id;
  const members = employees.filter(e => e.teamId === tid).map(emp => {
    const score = calcProductivityScore(emp.id);
    const velocities = getSprintVelocities(emp.id);
    return { emp, score: score.total, velocities, band: getBand(score.total).label };
  });
  return { members };
}

// ── Bug Quality ──
export function renderBugQuality() {
  const bugs = allIssues.filter(i => i.type === 'Bug');
  const fixedBugs = bugs.filter(b => b.status === 'Done');
  const fixRate = bugs.length ? Math.round(fixedBugs.length / bugs.length * 100) : 0;
  const avgSP = bugs.length ? Math.round(bugs.reduce((s, b) => s + b.storyPoints, 0) / bugs.length * 10) / 10 : 0;
  const density = allIssues.length ? Math.round(bugs.length / allIssues.length * 10000) / 100 : 0;

  const prioOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const sorted = [...bugs].sort((a, b) => (prioOrder[a.priority] ?? 9) - (prioOrder[b.priority] ?? 9) || b.storyPoints - a.storyPoints);

  const rows = sorted.slice(0, 40).map(b => {
    const emp = employees.find(e => e.id === b.assignee);
    return `<tr><td style="font-family:var(--font-mono);font-size:.75rem">${b.id}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.title}</td><td><span class="priority-dot ${b.priority.toLowerCase()}"></span>${b.priority}</td><td><span class="status-badge ${b.status.toLowerCase().replace(/ /g,'-')}">${b.status}</span></td><td>${emp?.name || 'Unassigned'}</td><td style="color:var(--text-secondary);font-size:.8rem">${b.sprintName}</td><td style="font-weight:600">${b.storyPoints}</td></tr>`;
  }).join('');

  return `<div class="section-header"><h2>🐛 Bug Quality</h2><span class="section-badge">${bugs.length} Total Bugs</span></div>
  <div class="kpi-grid">
    ${kpi('Total Bugs', bugs.length, '🐛', '--rose', `${fixedBugs.length} fixed`, fixRate > 60 ? 'up' : 'down')}
    ${kpi('Bug Fix Rate', `${fixRate}%`, '🔧', '--green', fixRate > 70 ? 'Healthy' : 'Needs attention', fixRate > 70 ? 'up' : 'down')}
    ${kpi('Avg Bug SP', avgSP, '⚡', '--amber', 'story points per bug', 'neutral')}
    ${kpi('Bug Density', `${density}%`, '📊', '--purple', 'bugs per 100 issues', density < 25 ? 'up' : 'down')}
  </div>
  <div class="table-container mt-6"><div class="table-header"><h3>Bug Tracker</h3></div>
  <div style="max-height:500px;overflow-y:auto"><table><thead><tr><th>Key</th><th>Title</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Sprint</th><th>SP</th></tr></thead>
  <tbody>${rows}</tbody></table></div></div>`;
}

export function getBugChartData() {
  const bugs = allIssues.filter(i => i.type === 'Bug');
  const bugsBySprint = sprints.map(s => {
    const sb = bugs.filter(b => b.sprint === s.id);
    return { sprint: s.name, open: sb.filter(b => b.status !== 'Done').length, fixed: sb.filter(b => b.status === 'Done').length };
  });
  const bugsByPriority = { critical: 0, high: 0, medium: 0, low: 0 };
  bugs.forEach(b => { const k = b.priority.toLowerCase(); if (k in bugsByPriority) bugsByPriority[k]++; });
  return { bugsBySprint, bugsByPriority };
}
