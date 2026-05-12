// ──────────────────────────────────────────────
// Enterprise Views – Executive, Sprint Retro, Capacity, Risk, OKR, Dept
// ──────────────────────────────────────────────
import { employees, teams, departments, sprints, allIssues, okrs, getOverallMetrics, getSprintMetrics, getTeamMetrics, getDeptMetrics } from './data.js';

const avatarColors = ['#6C5CE7','#00B4D8','#00C9A7','#FFB347','#FF6B8A','#A78BFA','#F97316','#14B8A6','#EC4899','#8B5CF6','#06B6D4','#10B981'];
function getColor(i) { return avatarColors[i % avatarColors.length]; }
function kpi(label, value, icon, colorVar, trend, dir) {
  return `<div class="kpi-card"><div class="kpi-glow" style="background:var(${colorVar})"></div><div class="kpi-icon" style="background:var(${colorVar})18;color:var(${colorVar})">${icon}</div><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-trend ${dir}"><span>${dir === 'up' ? '↑' : dir === 'down' ? '↓' : '•'}</span> ${trend}</div></div>`;
}

// ── Executive Summary ──
export function renderExecutive() {
  const totalEmp = employees.length;
  const totalIssues = allIssues.length;
  const doneIssues = allIssues.filter(i => i.status === 'Done').length;
  const totalSP = allIssues.reduce((s, i) => s + i.storyPoints, 0);
  const doneSP = allIssues.filter(i => i.status === 'Done').reduce((s, i) => s + i.storyPoints, 0);
  const blocked = allIssues.filter(i => i.status === 'Blocked').length;
  const avgVel = Math.round(doneSP / sprints.length);
  const compRate = Math.round((doneIssues / totalIssues) * 100);

  const deptCards = departments.map(d => {
    const m = getDeptMetrics(d.id);
    return `<div class="dept-card" style="border-left:3px solid ${d.color}">
      <div class="dept-header"><h4>${d.name}</h4><span class="dept-badge">${m.memberCount} people · ${m.teams.length} teams</span></div>
      <div class="dept-stats">
        <div class="dept-stat"><span class="stat-value">${m.completionRate}%</span><span class="stat-label">Completion</span></div>
        <div class="dept-stat"><span class="stat-value">${m.avgVelocity}</span><span class="stat-label">Avg Velocity</span></div>
        <div class="dept-stat"><span class="stat-value">${m.blockedIssues}</span><span class="stat-label">Blocked</span></div>
        <div class="dept-stat"><span class="stat-value">${m.completedSP}</span><span class="stat-label">SP Done</span></div>
      </div>
      <div class="progress-bar" style="margin-top:8px"><div class="fill" style="width:${m.completionRate}%;background:${d.color}"></div></div>
    </div>`;
  }).join('');

  const riskTeams = teams.map(t => {
    const m = getTeamMetrics(t.id);
    return { ...t, ...m };
  }).sort((a, b) => a.healthScore - b.healthScore).slice(0, 5);

  return `<div class="section-header"><h2>🏢 Executive Dashboard</h2><span class="section-badge">Enterprise Overview · ${totalEmp} Employees</span></div>
  <div class="kpi-grid">
    ${kpi('Total Workforce', totalEmp, '👥', '--accent', `${departments.length} departments`, 'neutral')}
    ${kpi('Active Teams', teams.length, '🏢', '--cyan', `${teams.length} agile teams`, 'up')}
    ${kpi('Total Issues', totalIssues.toLocaleString(), '📋', '--purple', `${doneIssues.toLocaleString()} completed`, 'up')}
    ${kpi('Story Points Delivered', doneSP.toLocaleString(), '⚡', '--green', `of ${totalSP.toLocaleString()} committed`, 'up')}
    ${kpi('Org Completion Rate', `${compRate}%`, '✅', '--green', '+3% vs last Q', 'up')}
    ${kpi('Blocked Issues', blocked, '🚫', '--rose', blocked > 20 ? 'Needs attention' : 'Acceptable', blocked > 20 ? 'down' : 'up')}
  </div>
  <div class="chart-grid">
    <div class="chart-card full-width"><h3>Department Velocity Trend</h3><p class="chart-subtitle">Story points delivered per sprint across departments</p><div style="height:320px"><canvas id="execDeptVelocity"></canvas></div></div>
  </div>
  <div class="section-header mt-4"><h3>Department Performance</h3></div>
  <div class="dept-grid">${deptCards}</div>
  <div class="section-header mt-6"><h3>⚠️ At-Risk Teams</h3></div>
  <div class="table-container"><table><thead><tr><th>Team</th><th>Department</th><th>Health Score</th><th>Completion</th><th>Blocked</th><th>Velocity</th></tr></thead>
  <tbody>${riskTeams.map(t => {
    const dept = departments.find(d => d.id === t.dept);
    return `<tr><td style="font-weight:600">${t.name}</td><td style="color:var(--text-secondary)">${dept?.name || ''}</td>
    <td><span style="color:${t.healthScore > 70 ? 'var(--green)' : t.healthScore > 50 ? 'var(--amber)' : 'var(--rose)'};font-weight:700">${t.healthScore}</span></td>
    <td>${t.completionRate}%</td><td style="color:var(--rose);font-weight:600">${t.blockedIssues}</td><td>${t.avgVelocity} SP</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export function getExecChartData() {
  const deptLabels = departments.map(d => d.name.split(' ')[0]);
  const deptData = departments.map(d => {
    const m = getDeptMetrics(d.id);
    return sprints.slice(-6).map(s => {
      const members = employees.filter(e => e.departmentId === d.id);
      return allIssues.filter(i => i.sprint === s.id && i.status === 'Done' && members.some(m => m.id === i.assignee)).reduce((sum, i) => sum + i.storyPoints, 0);
    });
  });
  return { labels: sprints.slice(-6).map(s => s.name.replace('Sprint ', '')), deptLabels, deptData, colors: departments.map(d => d.color) };
}

// ── Sprint Retrospective ──
export function renderSprintRetro(sprintId) {
  const sprint = sprintId ? sprints.find(s => s.id === sprintId) : sprints[sprints.length - 2];
  const si = allIssues.filter(i => i.sprint === sprint.id);
  const done = si.filter(i => i.status === 'Done');
  const carryOver = si.filter(i => i.status !== 'Done');
  const totalSP = si.reduce((s, i) => s + i.storyPoints, 0);
  const doneSP = done.reduce((s, i) => s + i.storyPoints, 0);
  const compRate = si.length ? Math.round(done.length / si.length * 100) : 0;

  // Per-team breakdown
  const teamBreakdown = teams.slice(0, 10).map(t => {
    const members = employees.filter(e => e.teamId === t.id);
    const tIssues = si.filter(i => members.some(m => m.id === i.assignee));
    const tDone = tIssues.filter(i => i.status === 'Done');
    return { team: t.name, total: tIssues.length, done: tDone.length, sp: tIssues.reduce((s, i) => s + i.storyPoints, 0), doneSp: tDone.reduce((s, i) => s + i.storyPoints, 0) };
  }).filter(t => t.total > 0);

  // Top contributors
  const contributors = {};
  done.forEach(i => { contributors[i.assignee] = (contributors[i.assignee] || 0) + i.storyPoints; });
  const topContribs = Object.entries(contributors).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, sp]) => {
    const emp = employees.find(e => e.id === id);
    return { emp, sp };
  });

  const sprintOpts = sprints.map(s => `<option value="${s.id}" ${s.id === sprint.id ? 'selected' : ''}>${s.name}</option>`).join('');

  return `<div class="section-header"><h2>🔄 Sprint Retrospective</h2>
    <select id="retroSprintSelect" class="comp-select" style="max-width:250px">${sprintOpts}</select></div>
  <div class="retro-sprint-info"><h3>${sprint.name}</h3><p>${sprint.startDate} → ${sprint.endDate} · ${sprint.goal || ''}</p></div>
  <div class="kpi-grid">
    ${kpi('Issues Completed', `${done.length}/${si.length}`, '✅', '--green', `${compRate}% rate`, compRate > 75 ? 'up' : 'down')}
    ${kpi('Story Points', `${doneSP}/${totalSP}`, '⚡', '--accent', `${Math.round(doneSP/Math.max(totalSP,1)*100)}% delivered`, 'up')}
    ${kpi('Carry-Over', carryOver.length, '📦', '--amber', `${carryOver.reduce((s,i)=>s+i.storyPoints,0)} SP unfinished`, carryOver.length > 10 ? 'down' : 'up')}
    ${kpi('Blocked', si.filter(i=>i.status==='Blocked').length, '🚫', '--rose', 'items blocked', 'down')}
  </div>
  <div class="chart-grid">
    <div class="chart-card"><h3>Sprint Completion by Team</h3><p class="chart-subtitle">Issues completed per team</p><div style="height:280px"><canvas id="retroTeamChart"></canvas></div></div>
    <div class="chart-card"><h3>Carry-Over Analysis</h3><p class="chart-subtitle">Unfinished work by type</p><div style="height:280px"><canvas id="retroCarryChart"></canvas></div></div>
  </div>
  <div class="grid-2 mt-4">
    <div class="table-container"><div class="table-header"><h3>🏆 Top Contributors</h3></div>
    <table><thead><tr><th>#</th><th>Name</th><th>SP Delivered</th></tr></thead>
    <tbody>${topContribs.map((c, i) => `<tr><td style="font-weight:700;color:var(--accent-light)">${i+1}</td><td><div class="flex items-center gap-2"><div class="emp-avatar" style="background:${getColor(employees.indexOf(c.emp))};width:28px;height:28px;font-size:.6rem">${c.emp?.avatar||'?'}</div>${c.emp?.name||'Unknown'}</div></td><td style="font-weight:700">${c.sp} SP</td></tr>`).join('')}</tbody></table></div>
    <div class="table-container"><div class="table-header"><h3>📦 Carry-Over Items</h3></div>
    <div style="max-height:300px;overflow-y:auto"><table><thead><tr><th>Key</th><th>Title</th><th>Status</th><th>SP</th></tr></thead>
    <tbody>${carryOver.slice(0,15).map(i => `<tr><td style="font-family:var(--font-mono);font-size:.75rem">${i.id}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</td><td><span class="status-badge ${i.status.toLowerCase().replace(/ /g,'-')}">${i.status}</span></td><td style="font-weight:600">${i.storyPoints}</td></tr>`).join('')}</tbody></table></div></div>
  </div>`;
}

export function getRetroChartData(sprintId) {
  const sprint = sprintId ? sprints.find(s => s.id === sprintId) : sprints[sprints.length - 2];
  const si = allIssues.filter(i => i.sprint === sprint.id);
  const carryOver = si.filter(i => i.status !== 'Done');
  const teamData = teams.slice(0, 10).map(t => {
    const members = employees.filter(e => e.teamId === t.id);
    const tIssues = si.filter(i => members.some(m => m.id === i.assignee));
    return { name: t.name, done: tIssues.filter(i => i.status === 'Done').length, notDone: tIssues.filter(i => i.status !== 'Done').length };
  }).filter(t => t.done + t.notDone > 0);

  const carryByType = { Story: 0, Bug: 0, Task: 0, Epic: 0, 'Sub-task': 0 };
  carryOver.forEach(i => { if (carryByType[i.type] !== undefined) carryByType[i.type]++; });

  return { teamData, carryByType };
}

// ── Capacity Planning ──
export function renderCapacity() {
  const activeSprint = sprints.find(s => s.status === 'Active') || sprints[sprints.length - 1];
  const teamCap = teams.slice(0, 12).map(t => {
    const members = employees.filter(e => e.teamId === t.id);
    const capacity = members.length * 40; // 40 hrs/sprint/person
    const activeIssues = allIssues.filter(i => i.sprint === activeSprint.id && members.some(m => m.id === i.assignee));
    const planned = activeIssues.reduce((s, i) => s + i.estimatedHours, 0);
    const logged = activeIssues.reduce((s, i) => s + i.loggedHours, 0);
    const utilization = capacity > 0 ? Math.round((planned / capacity) * 100) : 0;
    return { team: t, members: members.length, capacity: Math.round(capacity), planned: Math.round(planned), logged: Math.round(logged), utilization, available: Math.round(capacity - planned) };
  });

  const totalCap = teamCap.reduce((s, t) => s + t.capacity, 0);
  const totalPlanned = teamCap.reduce((s, t) => s + t.planned, 0);
  const avgUtil = Math.round((totalPlanned / totalCap) * 100);

  return `<div class="section-header"><h2>📊 Capacity Planning</h2><span class="section-badge">${activeSprint.name}</span></div>
  <div class="kpi-grid">
    ${kpi('Total Capacity', `${totalCap}h`, '⏱️', '--cyan', `${teamCap.length} teams`, 'neutral')}
    ${kpi('Planned Work', `${totalPlanned}h`, '📋', '--accent', `${Math.round(totalPlanned/totalCap*100)}% allocated`, totalPlanned > totalCap ? 'down' : 'up')}
    ${kpi('Avg Utilization', `${avgUtil}%`, '📊', '--green', avgUtil > 90 ? 'Near capacity' : 'Healthy', avgUtil > 90 ? 'down' : 'up')}
    ${kpi('Available Hours', `${totalCap - totalPlanned}h`, '🆓', '--amber', 'remaining capacity', 'neutral')}
  </div>
  <div class="chart-grid"><div class="chart-card full-width"><h3>Team Capacity Utilization</h3><p class="chart-subtitle">Planned vs available capacity per team</p><div style="height:320px"><canvas id="capacityChart"></canvas></div></div></div>
  <div class="table-container"><div class="table-header"><h3>Team Capacity Breakdown</h3></div>
  <table><thead><tr><th>Team</th><th>Members</th><th>Capacity (h)</th><th>Planned (h)</th><th>Utilization</th><th>Available</th></tr></thead>
  <tbody>${teamCap.map(t => `<tr><td style="font-weight:600">${t.team.name}</td><td>${t.members}</td><td>${t.capacity}</td><td>${t.planned}</td>
  <td><div class="flex items-center gap-2"><div class="progress-bar" style="width:80px"><div class="fill" style="width:${Math.min(t.utilization,100)}%;background:${t.utilization > 100 ? 'var(--rose)' : t.utilization > 80 ? 'var(--amber)' : 'var(--green)'}"></div></div><span style="font-size:.75rem;font-weight:600;color:${t.utilization > 100 ? 'var(--rose)' : ''}">${t.utilization}%</span></div></td>
  <td style="color:${t.available < 0 ? 'var(--rose)' : 'var(--green)'};font-weight:600">${t.available}h</td></tr>`).join('')}</tbody></table></div>`;
}

export function getCapacityChartData() {
  const activeSprint = sprints.find(s => s.status === 'Active') || sprints[sprints.length - 1];
  return {
    labels: teams.slice(0, 12).map(t => t.name.split(' ').slice(0, 2).join(' ')),
    capacity: teams.slice(0, 12).map(t => employees.filter(e => e.teamId === t.id).length * 40),
    planned: teams.slice(0, 12).map(t => {
      const members = employees.filter(e => e.teamId === t.id);
      return Math.round(allIssues.filter(i => i.sprint === activeSprint.id && members.some(m => m.id === i.assignee)).reduce((s, i) => s + i.estimatedHours, 0));
    }),
  };
}

// ── Risk & Blockers ──
export function renderRisk() {
  const blocked = allIssues.filter(i => i.status === 'Blocked');
  const aging = blocked.map(i => {
    const days = Math.floor((Date.now() - new Date(i.updatedDate).getTime()) / 86400000);
    const emp = employees.find(e => e.id === i.assignee);
    return { ...i, ageDays: days, empName: emp?.name || 'Unassigned', empTeam: emp?.team || '' };
  }).sort((a, b) => b.ageDays - a.ageDays);

  const criticalBlocked = blocked.filter(i => i.priority === 'Critical' || i.priority === 'High');
  const blockedByTeam = {};
  blocked.forEach(i => {
    const emp = employees.find(e => e.id === i.assignee);
    const team = emp?.team || 'Unknown';
    blockedByTeam[team] = (blockedByTeam[team] || 0) + 1;
  });

  const atRiskSprints = sprints.filter(s => s.status === 'Active').map(s => {
    const si = allIssues.filter(i => i.sprint === s.id);
    const done = si.filter(i => i.status === 'Done').length;
    const rate = si.length ? Math.round(done / si.length * 100) : 0;
    return { sprint: s, rate, blocked: si.filter(i => i.status === 'Blocked').length, total: si.length };
  });

  return `<div class="section-header"><h2>⚠️ Risk & Blockers Dashboard</h2></div>
  <div class="kpi-grid">
    ${kpi('Total Blocked', blocked.length, '🚫', '--rose', `${criticalBlocked.length} high priority`, 'down')}
    ${kpi('Critical/High Blocked', criticalBlocked.length, '🔴', '--rose', 'needs escalation', 'down')}
    ${kpi('Avg Block Age', `${Math.round(aging.reduce((s,i)=>s+i.ageDays,0)/Math.max(aging.length,1))}d`, '⏰', '--amber', 'days blocked', 'down')}
    ${kpi('Teams Affected', Object.keys(blockedByTeam).length, '🏢', '--purple', 'have blocked work', 'down')}
  </div>
  <div class="chart-grid">
    <div class="chart-card"><h3>Blocked Issues by Team</h3><p class="chart-subtitle">Distribution across teams</p><div style="height:280px"><canvas id="riskTeamChart"></canvas></div></div>
    <div class="chart-card"><h3>Block Age Distribution</h3><p class="chart-subtitle">How long issues have been blocked</p><div style="height:280px"><canvas id="riskAgeChart"></canvas></div></div>
  </div>
  <div class="table-container"><div class="table-header"><h3>🚨 Aging Blocked Issues</h3></div>
  <div style="max-height:400px;overflow-y:auto"><table><thead><tr><th>Key</th><th>Title</th><th>Priority</th><th>Age</th><th>Assignee</th><th>Team</th></tr></thead>
  <tbody>${aging.slice(0,25).map(i => `<tr><td style="font-family:var(--font-mono);font-size:.75rem">${i.id}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</td><td><span class="priority-dot ${i.priority.toLowerCase()}"></span>${i.priority}</td><td style="font-weight:700;color:${i.ageDays>14?'var(--rose)':i.ageDays>7?'var(--amber)':'var(--text-primary)'}">${i.ageDays}d</td><td>${i.empName}</td><td style="color:var(--text-secondary);font-size:.8rem">${i.empTeam}</td></tr>`).join('')}</tbody></table></div></div>`;
}

export function getRiskChartData() {
  const blocked = allIssues.filter(i => i.status === 'Blocked');
  const byTeam = {};
  blocked.forEach(i => {
    const emp = employees.find(e => e.id === i.assignee);
    const team = emp?.team || 'Unknown';
    byTeam[team] = (byTeam[team] || 0) + 1;
  });
  const ageRanges = { '0-3 days': 0, '4-7 days': 0, '8-14 days': 0, '15-30 days': 0, '30+ days': 0 };
  blocked.forEach(i => {
    const days = Math.floor((Date.now() - new Date(i.updatedDate).getTime()) / 86400000);
    if (days <= 3) ageRanges['0-3 days']++;
    else if (days <= 7) ageRanges['4-7 days']++;
    else if (days <= 14) ageRanges['8-14 days']++;
    else if (days <= 30) ageRanges['15-30 days']++;
    else ageRanges['30+ days']++;
  });
  return { teamLabels: Object.keys(byTeam), teamValues: Object.values(byTeam), ageLabels: Object.keys(ageRanges), ageValues: Object.values(ageRanges) };
}

// ── OKR Tracking ──
export function renderOKR() {
  return `<div class="section-header"><h2>🎯 OKR & Goals Tracking</h2></div>
  <div class="okr-grid">${okrs.map(o => {
    const dept = departments.find(d => d.id === o.dept);
    return `<div class="okr-card"><div class="okr-header"><div class="okr-dept-badge" style="background:${dept?.color || '#6C5CE7'}20;color:${dept?.color || '#6C5CE7'}">${dept?.name || ''}</div><span class="okr-quarter">${o.quarter}</span></div>
    <h3 class="okr-title">${o.title}</h3>
    <div class="okr-progress-row"><div class="progress-bar" style="height:8px;flex:1"><div class="fill" style="width:${o.progress}%;background:linear-gradient(90deg,var(--accent),var(--cyan))"></div></div><span class="okr-pct">${o.progress}%</span></div>
    <div class="okr-krs">${o.keyResults.map(kr => `<div class="kr-item"><div class="kr-header"><span class="kr-title">${kr.title}</span><span class="kr-metric">${kr.metric}</span></div><div class="progress-bar" style="height:4px"><div class="fill" style="width:${kr.progress}%;background:${kr.progress > 70 ? 'var(--green)' : kr.progress > 40 ? 'var(--amber)' : 'var(--rose)'}"></div></div></div>`).join('')}</div></div>`;
  }).join('')}</div>`;
}
