import { employees, sprints, allIssues, teams, getOverallMetrics, getSprintMetrics, getEmployeeIssues } from './data.js';

const avatarColors = ['#6C5CE7','#00B4D8','#00C9A7','#FFB347','#FF6B8A','#A78BFA','#F97316','#14B8A6','#EC4899','#8B5CF6','#06B6D4','#10B981'];
function getColor(i) { return avatarColors[i % avatarColors.length]; }

// ── Productivity Score Algorithm ──
export function calcProductivityScore(empId) {
  const m = getOverallMetrics(empId);
  const completionWeight = 35;
  const velocityWeight = 25;
  const efficiencyWeight = 20;
  const consistencyWeight = 20;

  const completionScore = Math.min(m.completionRate, 100);
  const maxVel = Math.max(...employees.map(e => getOverallMetrics(e.id).avgVelocity), 1);
  const velocityScore = Math.min((m.avgVelocity / maxVel) * 100, 100);
  const efficiencyScore = Math.min(m.efficiency, 120) / 1.2;

  // Consistency: std deviation of per-sprint completion rates
  const sprintRates = sprints.map(s => {
    const sm = getSprintMetrics(empId, s.id);
    return sm.totalIssues > 0 ? sm.completedIssues / sm.totalIssues * 100 : 0;
  });
  const avgRate = sprintRates.reduce((a, b) => a + b, 0) / sprintRates.length;
  const variance = sprintRates.reduce((s, r) => s + (r - avgRate) ** 2, 0) / sprintRates.length;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(100 - stdDev * 2, 0);

  const total = (completionScore * completionWeight + velocityScore * velocityWeight + efficiencyScore * efficiencyWeight + consistencyScore * consistencyWeight) / 100;
  return {
    total: Math.round(total),
    completion: Math.round(completionScore),
    velocity: Math.round(velocityScore),
    efficiency: Math.round(efficiencyScore),
    consistency: Math.round(consistencyScore),
  };
}

// ── Leaderboard View ──
export function renderLeaderboard() {
  const ranked = employees.map((e, i) => ({
    ...e, idx: i, score: calcProductivityScore(e.id), metrics: getOverallMetrics(e.id),
  })).sort((a, b) => b.score.total - a.score.total);

  return `<div class="section-header"><h2>🏆 Productivity Leaderboard</h2></div>
  <div class="leaderboard-podium">
    ${ranked.slice(0, 3).map((r, pos) => `
      <div class="podium-card podium-${pos + 1}" data-emp="${r.id}">
        <div class="podium-rank">${pos === 0 ? '🥇' : pos === 1 ? '🥈' : '🥉'}</div>
        <div class="emp-avatar" style="background:${getColor(r.idx)};width:56px;height:56px;font-size:1.1rem;margin:0 auto 10px">${r.avatar}</div>
        <h3>${r.name}</h3>
        <p style="font-size:.75rem;color:var(--text-secondary);margin-bottom:12px">${r.role}</p>
        <div class="score-ring"><svg viewBox="0 0 100 100" width="80" height="80"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-elevated)" stroke-width="6"/><circle cx="50" cy="50" r="42" fill="none" stroke="${r.score.total >= 80 ? 'var(--green)' : r.score.total >= 60 ? 'var(--amber)' : 'var(--rose)'}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${r.score.total * 2.64} 264" transform="rotate(-90 50 50)" class="score-circle"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="var(--text-primary)" font-size="20" font-weight="800">${r.score.total}</text></svg></div>
        <div class="score-bars mt-4">
          ${scoreBar('Completion', r.score.completion, '--green')}
          ${scoreBar('Velocity', r.score.velocity, '--accent')}
          ${scoreBar('Efficiency', r.score.efficiency, '--cyan')}
          ${scoreBar('Consistency', r.score.consistency, '--amber')}
        </div>
      </div>
    `).join('')}
  </div>
  <div class="table-container mt-6"><div class="table-header"><h3>Full Rankings</h3></div>
  <table><thead><tr><th>#</th><th>Employee</th><th>Team</th><th>Score</th><th>Completion</th><th>Velocity</th><th>Efficiency</th><th>Consistency</th></tr></thead>
  <tbody>${ranked.map((r, i) => `<tr class="clickable-row" data-emp="${r.id}" style="cursor:pointer"><td style="font-weight:700;color:${i < 3 ? 'var(--accent-light)' : 'var(--text-secondary)'}">${i + 1}</td><td><div class="flex items-center gap-2"><div class="emp-avatar" style="background:${getColor(r.idx)};width:28px;height:28px;font-size:.6rem">${r.avatar}</div>${r.name}</div></td><td style="color:var(--text-secondary);font-size:.8rem">${r.team}</td><td><span style="font-weight:700;color:${r.score.total >= 80 ? 'var(--green)' : r.score.total >= 60 ? 'var(--amber)' : 'var(--rose)'}">${r.score.total}</span></td><td>${miniBar(r.score.completion, '--green')}</td><td>${miniBar(r.score.velocity, '--accent')}</td><td>${miniBar(r.score.efficiency, '--cyan')}</td><td>${miniBar(r.score.consistency, '--amber')}</td></tr>`).join('')}</tbody></table></div>`;
}

function scoreBar(label, val, color) {
  return `<div style="margin-bottom:6px"><div class="flex items-center" style="justify-content:space-between"><span style="font-size:.65rem;color:var(--text-secondary)">${label}</span><span style="font-size:.65rem;font-weight:600">${val}%</span></div><div class="progress-bar" style="height:4px"><div class="fill" style="width:${val}%;background:var(${color})"></div></div></div>`;
}

function miniBar(val, color) {
  return `<div class="flex items-center gap-2"><div class="progress-bar" style="width:60px;height:4px"><div class="fill" style="width:${val}%;background:var(${color})"></div></div><span style="font-size:.75rem">${val}%</span></div>`;
}

// ── Employee Comparison View ──
export function renderComparison(emp1Id, emp2Id) {
  const e1 = employees.find(e => e.id === emp1Id);
  const e2 = employees.find(e => e.id === emp2Id);
  const m1 = emp1Id ? getOverallMetrics(emp1Id) : null;
  const m2 = emp2Id ? getOverallMetrics(emp2Id) : null;
  const s1 = emp1Id ? calcProductivityScore(emp1Id) : null;
  const s2 = emp2Id ? calcProductivityScore(emp2Id) : null;

  const empOptions = employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

  return `<div class="section-header"><h2>⚖️ Employee Comparison</h2></div>
  <div class="comparison-selectors">
    <div class="comp-select-box"><label>Employee A</label><select id="compEmp1" class="comp-select">${empOptions}</select></div>
    <div class="comp-vs">VS</div>
    <div class="comp-select-box"><label>Employee B</label><select id="compEmp2" class="comp-select">${employees.map((e, i) => `<option value="${e.id}" ${i === 1 ? 'selected' : ''}>${e.name}</option>`).join('')}</select></div>
    <button class="comp-btn" id="compareBtn">Compare</button>
  </div>
  ${e1 && e2 && m1 && m2 ? renderComparisonResults(e1, e2, m1, m2, s1, s2) : ''}`;
}

function renderComparisonResults(e1, e2, m1, m2, s1, s2) {
  const i1 = employees.indexOf(e1);
  const i2 = employees.indexOf(e2);
  const metrics = [
    { label: 'Productivity Score', v1: s1.total, v2: s2.total, suffix: '' },
    { label: 'Completion Rate', v1: m1.completionRate, v2: m2.completionRate, suffix: '%' },
    { label: 'Avg Velocity', v1: m1.avgVelocity, v2: m2.avgVelocity, suffix: ' SP' },
    { label: 'Story Points', v1: m1.completedStoryPoints, v2: m2.completedStoryPoints, suffix: '' },
    { label: 'Issues Completed', v1: m1.completedIssues, v2: m2.completedIssues, suffix: '' },
    { label: 'Efficiency', v1: m1.efficiency, v2: m2.efficiency, suffix: '%' },
    { label: 'Hours Logged', v1: m1.totalLoggedHours, v2: m2.totalLoggedHours, suffix: 'h' },
    { label: 'Bugs Fixed', v1: m1.bugCount, v2: m2.bugCount, suffix: '' },
  ];

  return `<div class="comparison-grid mt-6">
    <div class="comp-header">
      <div class="comp-emp"><div class="emp-avatar" style="background:${getColor(i1)};width:48px;height:48px">${e1.avatar}</div><h3>${e1.name}</h3><p style="font-size:.75rem;color:var(--text-secondary)">${e1.role}</p></div>
      <div class="comp-emp"><div class="emp-avatar" style="background:${getColor(i2)};width:48px;height:48px">${e2.avatar}</div><h3>${e2.name}</h3><p style="font-size:.75rem;color:var(--text-secondary)">${e2.role}</p></div>
    </div>
    ${metrics.map(m => {
      const better = m.v1 > m.v2 ? 1 : m.v2 > m.v1 ? 2 : 0;
      const maxVal = Math.max(m.v1, m.v2, 1);
      return `<div class="comp-row"><div class="comp-val ${better === 1 ? 'winner' : ''}" style="text-align:right"><span>${m.v1}${m.suffix}</span><div class="progress-bar" style="width:100px;height:5px;margin-left:auto"><div class="fill" style="width:${(m.v1/maxVal)*100}%;background:var(--accent)"></div></div></div><div class="comp-label">${m.label}</div><div class="comp-val ${better === 2 ? 'winner' : ''}"><span>${m.v2}${m.suffix}</span><div class="progress-bar" style="width:100px;height:5px"><div class="fill" style="width:${(m.v2/maxVal)*100}%;background:var(--cyan)"></div></div></div></div>`;
    }).join('')}
  </div>
  <div class="chart-grid mt-6">
    <div class="chart-card"><h3>Velocity Comparison</h3><p class="chart-subtitle">Sprint-by-sprint story points</p><div style="height:260px"><canvas id="compVelocityChart"></canvas></div></div>
    <div class="chart-card"><h3>Score Breakdown</h3><p class="chart-subtitle">Productivity dimensions</p><div style="height:260px"><canvas id="compRadarChart"></canvas></div></div>
  </div>`;
}

export function getComparisonChartData(emp1Id, emp2Id) {
  const e1 = employees.find(e => e.id === emp1Id);
  const e2 = employees.find(e => e.id === emp2Id);
  const labels = sprints.map(s => s.name.replace('Sprint ', ''));
  const sp1 = sprints.map(s => getSprintMetrics(emp1Id, s.id).completedStoryPoints);
  const sp2 = sprints.map(s => getSprintMetrics(emp2Id, s.id).completedStoryPoints);
  const s1 = calcProductivityScore(emp1Id);
  const s2 = calcProductivityScore(emp2Id);
  return { e1, e2, labels, sp1, sp2, s1, s2 };
}

// ── Notifications ──
export function generateNotifications() {
  const notifs = [];
  employees.forEach(e => {
    const m = getOverallMetrics(e.id);
    if (m.blockedIssues > 2) notifs.push({ type: 'warning', icon: '🚫', msg: `${e.name} has ${m.blockedIssues} blocked issues`, time: '2h ago', empId: e.id });
    if (m.completionRate < 65) notifs.push({ type: 'alert', icon: '⚠️', msg: `${e.name}'s completion rate is low (${m.completionRate}%)`, time: '3h ago', empId: e.id });
    if (m.efficiency > 110) notifs.push({ type: 'success', icon: '🌟', msg: `${e.name} is performing above expectations!`, time: '1h ago', empId: e.id });
  });
  // Sprint notifications
  const activeSprint = sprints.find(s => s.status === 'Active');
  if (activeSprint) notifs.push({ type: 'info', icon: '🏃', msg: `${activeSprint.name} is currently active`, time: 'now' });
  notifs.push({ type: 'info', icon: '📊', msg: 'Weekly productivity report is ready', time: '30m ago' });
  notifs.push({ type: 'success', icon: '✅', msg: 'Data sync completed successfully', time: '1h ago' });
  return notifs.slice(0, 15);
}

// ── Activity Timeline ──
export function renderTimeline() {
  const activities = [];
  // Generate from recent issues
  const recentIssues = [...allIssues].sort((a, b) => b.updatedDate.localeCompare(a.updatedDate)).slice(0, 30);
  recentIssues.forEach(issue => {
    const emp = employees.find(e => e.id === issue.assignee);
    if (!emp) return;
    const idx = employees.indexOf(emp);
    const action = issue.status === 'Done' ? 'completed' : issue.status === 'In Review' ? 'moved to review' : issue.status === 'In Progress' ? 'started working on' : 'updated';
    activities.push({
      emp, idx, action, issue,
      time: issue.updatedDate,
    });
  });

  return `<div class="section-header"><h2>📋 Activity Timeline</h2></div>
  <div class="timeline-container">
    ${activities.map(a => `
      <div class="timeline-item">
        <div class="timeline-dot" style="background:${getColor(a.idx)}"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <div class="emp-avatar" style="background:${getColor(a.idx)};width:28px;height:28px;font-size:.6rem">${a.emp.avatar}</div>
            <span class="timeline-name">${a.emp.name}</span>
            <span class="timeline-action">${a.action}</span>
            <span class="issue-type ${a.issue.type.toLowerCase()}">${a.issue.type}</span>
          </div>
          <div class="timeline-issue">${a.issue.id}: ${a.issue.title}</div>
          <div class="timeline-time">${a.time}</div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// ── Workload Distribution ──
export function renderWorkload() {
  const empData = employees.map((e, i) => {
    const m = getOverallMetrics(e.id);
    const activeIssues = allIssues.filter(is => is.assignee === e.id && (is.status === 'In Progress' || is.status === 'In Review')).length;
    const totalActiveSP = allIssues.filter(is => is.assignee === e.id && is.status !== 'Done').reduce((s, is) => s + is.storyPoints, 0);
    const load = activeIssues > 6 ? 'overloaded' : activeIssues > 3 ? 'optimal' : 'underloaded';
    return { ...e, idx: i, metrics: m, activeIssues, totalActiveSP, load };
  });

  return `<div class="section-header"><h2>📊 Workload Distribution</h2></div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-glow" style="background:var(--rose)"></div><div class="kpi-icon" style="background:#ff6b8a18;color:var(--rose)">🔴</div><div class="kpi-label">Overloaded</div><div class="kpi-value">${empData.filter(e => e.load === 'overloaded').length}</div><div class="kpi-trend down">Needs rebalancing</div></div>
    <div class="kpi-card"><div class="kpi-glow" style="background:var(--green)"></div><div class="kpi-icon" style="background:#00c9a718;color:var(--green)">🟢</div><div class="kpi-label">Optimal Load</div><div class="kpi-value">${empData.filter(e => e.load === 'optimal').length}</div><div class="kpi-trend up">Healthy capacity</div></div>
    <div class="kpi-card"><div class="kpi-glow" style="background:var(--amber)"></div><div class="kpi-icon" style="background:#ffb34718;color:var(--amber)">🟡</div><div class="kpi-label">Underloaded</div><div class="kpi-value">${empData.filter(e => e.load === 'underloaded').length}</div><div class="kpi-trend neutral">Can take more</div></div>
    <div class="kpi-card"><div class="kpi-glow" style="background:var(--cyan)"></div><div class="kpi-icon" style="background:#00b4d818;color:var(--cyan)">📦</div><div class="kpi-label">Active SP</div><div class="kpi-value">${empData.reduce((s, e) => s + e.totalActiveSP, 0)}</div><div class="kpi-trend neutral">In progress</div></div>
  </div>
  <div class="chart-grid"><div class="chart-card full-width"><h3>Workload by Employee</h3><p class="chart-subtitle">Active issues and story points distribution</p><div style="height:300px"><canvas id="workloadChart"></canvas></div></div></div>
  <div class="workload-grid mt-4">
    ${empData.map(e => `
      <div class="workload-card ${e.load}" data-emp="${e.id}">
        <div class="workload-indicator ${e.load}"></div>
        <div class="flex items-center gap-3">
          <div class="emp-avatar" style="background:${getColor(e.idx)};width:36px;height:36px;font-size:.75rem">${e.avatar}</div>
          <div><div style="font-weight:600;font-size:.9rem">${e.name}</div><div style="font-size:.7rem;color:var(--text-secondary)">${e.team}</div></div>
        </div>
        <div class="workload-stats">
          <div class="wl-stat"><span class="wl-val">${e.activeIssues}</span><span class="wl-label">Active</span></div>
          <div class="wl-stat"><span class="wl-val">${e.totalActiveSP}</span><span class="wl-label">SP Left</span></div>
          <div class="wl-stat"><span class="wl-val">${e.metrics.completionRate}%</span><span class="wl-label">Done</span></div>
        </div>
        <div class="workload-tag ${e.load}">${e.load === 'overloaded' ? '🔴 Overloaded' : e.load === 'optimal' ? '🟢 Optimal' : '🟡 Available'}</div>
      </div>
    `).join('')}
  </div>`;
}

export function getWorkloadChartData() {
  return {
    names: employees.map(e => e.name.split(' ')[0]),
    activeIssues: employees.map(e => allIssues.filter(i => i.assignee === e.id && (i.status === 'In Progress' || i.status === 'In Review')).length),
    activeSP: employees.map(e => allIssues.filter(i => i.assignee === e.id && i.status !== 'Done').reduce((s, i) => s + i.storyPoints, 0)),
  };
}

// ── CSV Export ──
export function exportToCSV(type = 'all') {
  let csv = '';
  if (type === 'employees') {
    csv = 'Name,Role,Team,Email,Completion Rate,Avg Velocity,Story Points,Hours Logged,Productivity Score\n';
    employees.forEach(e => {
      const m = getOverallMetrics(e.id);
      const s = calcProductivityScore(e.id);
      csv += `"${e.name}","${e.role}","${e.team}","${e.email}",${m.completionRate}%,${m.avgVelocity},${m.completedStoryPoints},${m.totalLoggedHours},${s.total}\n`;
    });
  } else if (type === 'issues') {
    csv = 'Key,Title,Type,Status,Priority,Story Points,Assignee,Sprint,Estimated Hours,Logged Hours\n';
    allIssues.forEach(i => {
      const emp = employees.find(e => e.id === i.assignee);
      csv += `${i.id},"${i.title}",${i.type},${i.status},${i.priority},${i.storyPoints},"${emp?.name || ''}",${i.sprintName},${i.estimatedHours},${i.loggedHours}\n`;
    });
  } else {
    csv = 'Name,Role,Team,Productivity Score,Completion Rate,Velocity,Issues,Story Points\n';
    employees.forEach(e => {
      const m = getOverallMetrics(e.id);
      const s = calcProductivityScore(e.id);
      csv += `"${e.name}","${e.role}","${e.team}",${s.total},${m.completionRate}%,${m.avgVelocity},${m.totalIssues},${m.completedStoryPoints}\n`;
    });
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `jirapulse_${type}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
