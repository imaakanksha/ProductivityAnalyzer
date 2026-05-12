import { employees, sprints, allIssues, teams, teamNames, departments, okrs, generateActivityData, getEmployeeIssues, getSprintMetrics, getOverallMetrics, getTeamMetrics, getDeptMetrics } from './data.js';

const avatarColors = ['#6C5CE7','#00B4D8','#00C9A7','#FFB347','#FF6B8A','#A78BFA','#F97316','#14B8A6','#EC4899','#8B5CF6','#06B6D4','#10B981'];
function getColor(i) { return avatarColors[i % avatarColors.length]; }

// ── Dashboard View ──
export function renderDashboard() {
  const totalEmp = employees.length;
  const totalIssues = allIssues.length;
  const doneIssues = allIssues.filter(i => i.status === 'Done').length;
  const totalSP = allIssues.reduce((s, i) => s + i.storyPoints, 0);
  const doneSP = allIssues.filter(i => i.status === 'Done').reduce((s, i) => s + i.storyPoints, 0);
  const avgVel = Math.round(doneSP / sprints.length);
  const compRate = Math.round((doneIssues / totalIssues) * 100);
  const totalHrs = Math.round(allIssues.reduce((s, i) => s + i.loggedHours, 0));

  return `
    <div class="kpi-grid">
      ${kpi('Total Employees', totalEmp, '👥', '--accent', '+2 this quarter', 'up')}
      ${kpi('Total Issues', totalIssues, '📋', '--cyan', `${doneIssues} completed`, 'up')}
      ${kpi('Story Points', `${doneSP}/${totalSP}`, '⚡', '--green', `${Math.round(doneSP/totalSP*100)}% done`, 'up')}
      ${kpi('Avg Velocity', `${avgVel} SP`, '🚀', '--purple', 'per sprint', 'neutral')}
      ${kpi('Completion Rate', `${compRate}%`, '✅', '--green', '+5% vs last Q', 'up')}
      ${kpi('Hours Logged', totalHrs.toLocaleString(), '⏱️', '--amber', 'total hours', 'neutral')}
    </div>
    <div class="chart-grid">
      <div class="chart-card"><h3>Sprint Velocity Trend</h3><p class="chart-subtitle">Completed vs committed story points per sprint</p><div style="height:280px"><canvas id="chartVelocity"></canvas></div></div>
      <div class="chart-card"><h3>Issue Distribution</h3><p class="chart-subtitle">Breakdown by issue type across all employees</p><div style="height:280px"><canvas id="chartIssueType"></canvas></div></div>
      <div class="chart-card"><h3>Time Tracking Overview</h3><p class="chart-subtitle">Estimated vs logged hours per sprint</p><div style="height:280px"><canvas id="chartTime"></canvas></div></div>
      <div class="chart-card"><h3>Priority Distribution</h3><p class="chart-subtitle">Issues by priority level</p><div style="height:280px"><canvas id="chartPriority"></canvas></div></div>
    </div>
    <div class="section-header"><h2>Top Performers</h2></div>
    <div class="employee-grid">${employees.slice(0, 6).map((e, i) => empCard(e, i)).join('')}</div>`;
}

export function getDashboardChartData() {
  const sprintLabels = sprints.map(s => s.name.replace('Sprint ', ''));
  const completedSP = sprints.map(s => allIssues.filter(i => i.sprint === s.id && i.status === 'Done').reduce((sum, i) => sum + i.storyPoints, 0));
  const totalSP = sprints.map(s => allIssues.filter(i => i.sprint === s.id).reduce((sum, i) => sum + i.storyPoints, 0));
  const estimated = sprints.map(s => Math.round(allIssues.filter(i => i.sprint === s.id).reduce((sum, i) => sum + i.estimatedHours, 0)));
  const logged = sprints.map(s => Math.round(allIssues.filter(i => i.sprint === s.id).reduce((sum, i) => sum + i.loggedHours, 0)));
  const m = getOverallMetrics(employees[0].id);
  const allMetrics = { storyCount: allIssues.filter(i => i.type === 'Story').length, taskCount: allIssues.filter(i => i.type === 'Task').length, bugCount: allIssues.filter(i => i.type === 'Bug').length, epicCount: allIssues.filter(i => i.type === 'Epic').length, subtaskCount: allIssues.filter(i => i.type === 'Sub-task').length };
  const pb = { critical: allIssues.filter(i => i.priority === 'Critical').length, high: allIssues.filter(i => i.priority === 'High').length, medium: allIssues.filter(i => i.priority === 'Medium').length, low: allIssues.filter(i => i.priority === 'Low').length };
  return { sprintLabels, completedSP, totalSP, estimated, logged, allMetrics, pb };
}

// ── Employees View ──
export function renderEmployees() {
  return `<div class="section-header"><h2>All Employees</h2><div class="section-actions"><div class="search-box" style="min-width:220px;cursor:text"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><input type="text" placeholder="Filter employees..." id="empFilter" style="pointer-events:auto" /></div></div></div>
  <div class="employee-grid" id="empGrid">${employees.map((e, i) => empCard(e, i)).join('')}</div>`;
}

// ── Employee Detail View ──
export function renderEmployeeDetail(empId) {
  const emp = employees.find(e => e.id === empId);
  if (!emp) return '<div class="empty-state"><h3>Employee not found</h3></div>';
  const idx = employees.indexOf(emp);
  const m = getOverallMetrics(empId);
  const activity = generateActivityData(empId);

  return `
    <div class="back-btn" id="backBtn">← Back to Employees</div>
    <div class="emp-detail-header">
      <div class="emp-detail-avatar" style="background:${getColor(idx)}">${emp.avatar}</div>
      <div class="emp-detail-info">
        <h1>${emp.name}</h1>
        <div class="emp-meta">
          <span>💼 ${emp.role}</span><span>🏢 ${emp.team}</span><span>📧 ${emp.email}</span><span>📅 Joined ${emp.joinDate}</span>
        </div>
      </div>
    </div>
    <div class="kpi-grid">
      ${kpi('Issues Completed', `${m.completedIssues}/${m.totalIssues}`, '✅', '--green', `${m.completionRate}% rate`, m.completionRate > 70 ? 'up' : 'down')}
      ${kpi('Story Points', `${m.completedStoryPoints}/${m.totalStoryPoints}`, '⚡', '--accent', `${m.avgVelocity} SP/sprint`, 'up')}
      ${kpi('Hours Logged', m.totalLoggedHours, '⏱️', '--amber', `Est: ${m.totalEstimatedHours}h`, 'neutral')}
      ${kpi('Efficiency', `${m.efficiency}%`, '📊', '--cyan', m.efficiency > 90 ? 'Excellent' : 'Good', m.efficiency > 90 ? 'up' : 'neutral')}
      ${kpi('Avg Cycle Time', `${m.avgCycleTime}d`, '🔄', '--purple', 'days per issue', 'neutral')}
      ${kpi('Blocked Issues', m.blockedIssues, '🚫', '--rose', m.blockedIssues > 3 ? 'Needs attention' : 'Healthy', m.blockedIssues > 3 ? 'down' : 'up')}
    </div>
    <div class="chart-grid">
      <div class="chart-card"><h3>Sprint Velocity</h3><p class="chart-subtitle">Story points per sprint</p><div style="height:260px"><canvas id="empVelocity"></canvas></div></div>
      <div class="chart-card"><h3>Issue Breakdown</h3><p class="chart-subtitle">By type</p><div style="height:260px"><canvas id="empIssueType"></canvas></div></div>
      <div class="chart-card"><h3>Time Tracking</h3><p class="chart-subtitle">Estimated vs logged</p><div style="height:260px"><canvas id="empTimeChart"></canvas></div></div>
      <div class="chart-card"><h3>Status Overview</h3><p class="chart-subtitle">Current issue statuses</p><div style="height:260px"><canvas id="empStatusBar"></canvas></div></div>
    </div>
    ${renderHeatmap(activity)}
    ${renderIssueTable(empId)}`;
}

export function getEmployeeChartData(empId) {
  const m = getOverallMetrics(empId);
  const sprintLabels = sprints.map(s => s.name.replace('Sprint ', ''));
  const completedSP = sprints.map(s => { const sm = getSprintMetrics(empId, s.id); return sm.completedStoryPoints; });
  const totalSP = sprints.map(s => { const sm = getSprintMetrics(empId, s.id); return sm.totalStoryPoints; });
  const estimated = sprints.map(s => { const iss = allIssues.filter(i => i.assignee === empId && i.sprint === s.id); return Math.round(iss.reduce((sum, i) => sum + i.estimatedHours, 0)); });
  const logged = sprints.map(s => { const iss = allIssues.filter(i => i.assignee === empId && i.sprint === s.id); return Math.round(iss.reduce((sum, i) => sum + i.loggedHours, 0)); });
  return { m, sprintLabels, completedSP, totalSP, estimated, logged };
}

// ── Sprint Analysis View ──
export function renderSprintAnalysis() {
  return `<div class="section-header"><h2>Sprint Analysis</h2></div>
  <div class="chart-grid">
    <div class="chart-card full-width"><h3>Sprint Burndown (Latest Sprint)</h3><p class="chart-subtitle">Ideal vs actual progress</p><div style="height:300px"><canvas id="burndownChart"></canvas></div></div>
  </div>
  <div class="table-container"><div class="table-header"><h3>Sprint Summary</h3></div>
  <table><thead><tr><th>Sprint</th><th>Status</th><th>Issues</th><th>Completed</th><th>Story Points</th><th>Completion</th></tr></thead>
  <tbody>${sprints.map(s => {
    const issues = allIssues.filter(i => i.sprint === s.id);
    const done = issues.filter(i => i.status === 'Done');
    const sp = issues.reduce((sum, i) => sum + i.storyPoints, 0);
    const doneSp = done.reduce((sum, i) => sum + i.storyPoints, 0);
    const rate = issues.length ? Math.round(done.length / issues.length * 100) : 0;
    return `<tr><td>${s.name}</td><td><span class="status-badge ${s.status === 'Active' ? 'in-progress' : 'done'}">${s.status}</span></td><td>${issues.length}</td><td>${done.length}</td><td>${doneSp}/${sp}</td><td><div class="flex items-center gap-2"><div class="progress-bar" style="width:100px"><div class="fill" style="width:${rate}%;background:linear-gradient(90deg,var(--accent),var(--cyan))"></div></div><span style="font-size:.75rem">${rate}%</span></div></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export function getBurndownData() {
  const days = Array.from({ length: 10 }, (_, i) => `Day ${i + 1}`);
  const totalSP = 80;
  const ideal = days.map((_, i) => Math.round(totalSP - (totalSP / 9) * i));
  const actual = [80, 76, 70, 65, 55, 48, 40, 30, 18, 5];
  return { days, ideal, actual };
}

// ── Issue Tracker View ──
export function renderIssueTracker() {
  return `<div class="section-header"><h2>Issue Tracker</h2></div>
  <div class="table-container"><div class="table-header"><h3>All Issues</h3>
  <div class="table-filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="Story">Stories</button>
    <button class="filter-btn" data-filter="Bug">Bugs</button>
    <button class="filter-btn" data-filter="Task">Tasks</button>
    <button class="filter-btn" data-filter="Epic">Epics</button>
  </div></div>
  <div style="max-height:500px;overflow-y:auto">
  <table><thead><tr><th>Key</th><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>SP</th><th>Assignee</th></tr></thead>
  <tbody id="issueTableBody">${renderIssueRows(allIssues.slice(0, 80))}</tbody></table></div></div>`;
}

function renderIssueRows(issues) {
  return issues.map(i => {
    const emp = employees.find(e => e.id === i.assignee);
    const typeClass = i.type.toLowerCase().replace('-', '-');
    const statusClass = i.status.toLowerCase().replace(/ /g, '-');
    return `<tr><td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-secondary)">${i.id}</td><td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</td><td><span class="issue-type ${typeClass}">${i.type}</span></td><td><span class="status-badge ${statusClass}">${i.status}</span></td><td><span class="priority-dot ${i.priority.toLowerCase()}"></span>${i.priority}</td><td style="font-weight:600">${i.storyPoints}</td><td>${emp ? emp.name : '—'}</td></tr>`;
  }).join('');
}

// ── Team Overview View ──
export function renderTeamOverview() {
  return `<div class="section-header"><h2>Team Overview</h2></div>
  <div class="chart-grid"><div class="chart-card full-width"><h3>Team Performance Comparison</h3><p class="chart-subtitle">Velocity and completion rates across teams</p><div style="height:300px"><canvas id="teamCompChart"></canvas></div></div></div>
  ${teams.slice(0, 10).map(team => {
    const members = employees.filter(e => e.teamId === team.id);
    const dept = departments.find(d => d.id === team.dept);
    return `<div class="team-card"><h3>${team.name}</h3><p class="team-sub">${members.length} member${members.length > 1 ? 's' : ''} · ${dept ? dept.name : ''}</p>
    ${members.slice(0, 8).map((m, i) => {
      const idx = employees.indexOf(m);
      const met = getOverallMetrics(m.id);
      return `<div class="team-member-row" style="cursor:pointer" data-emp="${m.id}"><div class="tm-avatar" style="background:${getColor(idx)}">${m.avatar}</div><div class="tm-info"><div class="tm-name">${m.name}</div><div class="tm-role">${m.role}</div></div><div class="tm-score text-accent">${met.avgVelocity} SP</div><div class="tm-score" style="min-width:70px"><div class="progress-bar"><div class="fill" style="width:${met.completionRate}%;background:${met.completionRate > 75 ? 'var(--green)' : met.completionRate > 50 ? 'var(--amber)' : 'var(--rose)'}"></div></div><span style="font-size:.65rem;color:var(--text-secondary)">${met.completionRate}%</span></div></div>`;
    }).join('')}</div>`;
  }).join('')}`;
}

export function getTeamChartData() {
  const names = teams.slice(0, 10).map(t => t.name);
  const velocities = teams.slice(0, 10).map(t => {
    const members = employees.filter(e => e.teamId === t.id);
    if (!members.length) return 0;
    const avg = members.reduce((s, m) => s + getOverallMetrics(m.id).avgVelocity, 0) / members.length;
    return Math.round(avg);
  });
  const completionRates = teams.slice(0, 10).map(t => {
    const members = employees.filter(e => e.teamId === t.id);
    if (!members.length) return 0;
    const avg = members.reduce((s, m) => s + getOverallMetrics(m.id).completionRate, 0) / members.length;
    return Math.round(avg);
  });
  return { names, velocities, completionRates };
}

// ── Settings View ──
export function renderSettings() {
  return `<div class="section-header"><h2>Settings</h2></div>
  <div class="settings-grid">
    <div class="settings-card"><h3>Jira Connection</h3>
      <div class="setting-row"><div><div class="setting-label">Jira Instance URL</div><div class="setting-desc">https://company.atlassian.net</div></div><span class="status-badge done">Connected</span></div>
      <div class="setting-row"><div><div class="setting-label">API Token</div><div class="setting-desc">••••••••••••••••</div></div><button class="filter-btn">Update</button></div>
      <div class="setting-row"><div><div class="setting-label">Auto Sync</div><div class="setting-desc">Sync data every 30 minutes</div></div><div class="toggle active" id="toggleSync"></div></div>
    </div>
    <div class="settings-card"><h3>Display Preferences</h3>
      <div class="setting-row"><div><div class="setting-label">Dark Mode</div><div class="setting-desc">Use dark theme</div></div><div class="toggle active" id="toggleDark"></div></div>
      <div class="setting-row"><div><div class="setting-label">Animations</div><div class="setting-desc">Enable UI animations</div></div><div class="toggle active" id="toggleAnim"></div></div>
      <div class="setting-row"><div><div class="setting-label">Compact View</div><div class="setting-desc">Reduce spacing and card sizes</div></div><div class="toggle" id="toggleCompact"></div></div>
    </div>
    <div class="settings-card"><h3>Data & Export</h3>
      <div class="setting-row"><div><div class="setting-label">Export Format</div><div class="setting-desc">Choose default export format</div></div><select style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 12px;color:var(--text-primary);font-size:.8rem"><option>CSV</option><option>JSON</option><option>PDF</option></select></div>
      <div class="setting-row"><div><div class="setting-label">Date Range</div><div class="setting-desc">Default analysis period</div></div><select style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 12px;color:var(--text-primary);font-size:.8rem"><option>Last 3 months</option><option>Last 6 months</option><option>Last year</option></select></div>
    </div>
    <div class="settings-card"><h3>About JiraPulse</h3>
      <div class="setting-row"><div><div class="setting-label">Version</div><div class="setting-desc">v2.4.0</div></div></div>
      <div class="setting-row"><div><div class="setting-label">Last Data Sync</div><div class="setting-desc">${new Date().toLocaleString()}</div></div></div>
    </div>
  </div>`;
}

// ── Helpers ──
function kpi(label, value, icon, colorVar, trend, dir) {
  return `<div class="kpi-card"><div class="kpi-glow" style="background:var(${colorVar})"></div><div class="kpi-icon" style="background:var(${colorVar})18;color:var(${colorVar})">${icon}</div><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-trend ${dir}"><span>${dir === 'up' ? '↑' : dir === 'down' ? '↓' : '•'}</span> ${trend}</div></div>`;
}

function empCard(emp, idx) {
  const m = getOverallMetrics(emp.id);
  return `<div class="emp-card" data-emp="${emp.id}"><div class="emp-card-header"><div class="emp-avatar" style="background:${getColor(idx)}">${emp.avatar}</div><div class="emp-info"><h3>${emp.name}</h3><p>${emp.role} · ${emp.team}</p></div></div><div class="emp-stats"><div class="emp-stat"><span class="stat-value text-accent">${m.completedStoryPoints}</span><span class="stat-label">Story Pts</span></div><div class="emp-stat"><span class="stat-value text-green">${m.completionRate}%</span><span class="stat-label">Done Rate</span></div><div class="emp-stat"><span class="stat-value text-cyan">${m.avgVelocity}</span><span class="stat-label">Velocity</span></div></div><div class="emp-bar" style="width:${m.completionRate}%"></div></div>`;
}

function renderHeatmap(activity) {
  const cells = activity.map(a => {
    const lvl = a.activityLevel <= 2 ? 0 : a.activityLevel <= 4 ? 1 : a.activityLevel <= 6 ? 2 : a.activityLevel <= 8 ? 3 : 4;
    return `<div class="heatmap-cell" data-level="${lvl}" title="${a.date}: ${a.issuesUpdated} issues, ${a.hoursLogged}h logged"></div>`;
  }).join('');
  return `<div class="heatmap-container"><h3>Activity Heatmap</h3><div class="heatmap-grid">${cells}</div><div class="heatmap-legend"><span>Less</span><div class="heatmap-cell" data-level="0"></div><div class="heatmap-cell" data-level="1"></div><div class="heatmap-cell" data-level="2"></div><div class="heatmap-cell" data-level="3"></div><div class="heatmap-cell" data-level="4"></div><span>More</span></div></div>`;
}

function renderIssueTable(empId) {
  const issues = getEmployeeIssues(empId).slice(0, 40);
  return `<div class="table-container"><div class="table-header"><h3>Recent Issues</h3></div><div style="max-height:400px;overflow-y:auto"><table><thead><tr><th>Key</th><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>SP</th><th>Sprint</th></tr></thead><tbody>${issues.map(i => {
    const tc = i.type.toLowerCase().replace('-', '-');
    const sc = i.status.toLowerCase().replace(/ /g, '-');
    return `<tr><td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-secondary)">${i.id}</td><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</td><td><span class="issue-type ${tc}">${i.type}</span></td><td><span class="status-badge ${sc}">${i.status}</span></td><td><span class="priority-dot ${i.priority.toLowerCase()}"></span>${i.priority}</td><td style="font-weight:600">${i.storyPoints}</td><td style="font-size:.75rem;color:var(--text-secondary)">${i.sprintName.replace('Sprint ', '')}</td></tr>`;
  }).join('')}</tbody></table></div></div>`;
}

// ── Search ──
export function searchData(query) {
  const q = query.toLowerCase();
  const results = [];
  employees.forEach(e => {
    if (e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.team.toLowerCase().includes(q)) {
      results.push({ type: 'employee', id: e.id, title: e.name, sub: `${e.role} · ${e.team}`, color: getColor(employees.indexOf(e)), avatar: e.avatar });
    }
  });
  allIssues.slice(0, 500).forEach(i => {
    if (i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)) {
      results.push({ type: 'issue', id: i.id, title: i.id, sub: i.title, color: '#5a5c72', avatar: i.type[0] });
    }
  });
  return results.slice(0, 12);
}
