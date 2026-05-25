import './style.css';
import { renderDashboard, getDashboardChartData, renderEmployees, renderEmployeeDetail, getEmployeeChartData, renderSprintAnalysis, getBurndownData, renderIssueTracker, renderTeamOverview, getTeamChartData, renderSettings, searchData } from './views.js';
import { renderLeaderboard, renderComparison, getComparisonChartData, generateNotifications, renderTimeline, renderWorkload, getWorkloadChartData, exportToCSV } from './features.js';
import { renderExecutive, getExecChartData, renderSprintRetro, getRetroChartData, renderCapacity, getCapacityChartData, renderRisk, getRiskChartData, renderOKR } from './enterprise.js';
import { renderPerformanceReview, getPerformanceData, renderBugQuality, getBugChartData } from './insights.js';
import { renderVelocityChart, renderIssueTypePie, renderTimeChart, renderPriorityRadar, renderStatusBar, renderBurndownChart, renderTeamComparisonChart, renderCompVelocity, renderCompRadar, renderWorkloadBar, renderDeptVelocityChart, renderRetroTeamChart, renderRetroCarryChart, renderCapacityBarChart, renderRiskTeamChart, renderRiskAgeChart, renderBugsBySprintChart, renderBugsByPriorityChart, destroyAll } from './charts.js';
import { employees, allIssues } from './data.js';
import { checkHealth, triggerSync, getExportUrl, isBackendAvailable } from './api.js';

// ── State ──
let currentView = 'dashboard';
let selectedEmployee = null;
let backendMode = false;


// ── DOM Refs ──
const viewContainer = document.getElementById('viewContainer');
const breadcrumb = document.getElementById('breadcrumb');
const searchModal = document.getElementById('searchModal');
const modalSearchInput = document.getElementById('modalSearchInput');
const searchResults = document.getElementById('searchResults');
const toastContainer = document.getElementById('toastContainer');
const notifPanel = document.getElementById('notifPanel');
const notifBadge = document.getElementById('notifBadge');
const exportDropdown = document.getElementById('exportDropdown');

// ── Navigation ──
function navigate(view, empId = null) {
  destroyAll();
  currentView = view;
  selectedEmployee = empId;

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`[data-view="${view}"]`);
  if (activeNav) activeNav.classList.add('active');

  let bcText = { dashboard: 'Dashboard', employees: 'Employees', leaderboard: 'Leaderboard', sprints: 'Sprint Analysis', issues: 'Issue Tracker', comparison: 'Compare', team: 'Team Overview', workload: 'Workload', timeline: 'Timeline', executive: 'Executive Summary', retro: 'Sprint Retrospective', capacity: 'Capacity Planning', risk: 'Risk & Blockers', okr: 'OKR & Goals', performance: 'Performance Reviews', bugs: 'Bug Quality', settings: 'Settings' }[view] || view;
  if (view === 'employee-detail') {
    const emp = employees.find(e => e.id === empId);
    bcText = emp ? emp.name : 'Employee';
  }
  breadcrumb.innerHTML = `<span class="bc-item">JiraPulse</span><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span class="bc-item active">${bcText}</span>`;

  switch (view) {
    case 'dashboard': renderDashboardView(); break;
    case 'employees': renderEmployeesView(); break;
    case 'employee-detail': renderEmployeeDetailView(empId); break;
    case 'leaderboard': renderLeaderboardView(); break;
    case 'sprints': renderSprintView(); break;
    case 'issues': renderIssuesView(); break;
    case 'comparison': renderComparisonView(); break;
    case 'team': renderTeamView(); break;
    case 'workload': renderWorkloadView(); break;
    case 'timeline': renderTimelineView(); break;
    case 'executive': renderExecutiveView(); break;
    case 'retro': renderRetroView(); break;
    case 'capacity': renderCapacityView(); break;
    case 'risk': renderRiskView(); break;
    case 'okr': renderOKRView(); break;
    case 'performance': renderPerformanceView(); break;
    case 'bugs': renderBugQualityView(); break;
    case 'settings': renderSettingsView(); break;
  }

  viewContainer.style.animation = 'none';
  viewContainer.offsetHeight;
  viewContainer.style.animation = 'fadeIn .3s ease';
}

function renderDashboardView() {
  viewContainer.innerHTML = renderDashboard();
  const d = getDashboardChartData();
  setTimeout(() => {
    renderVelocityChart('chartVelocity', d.sprintLabels, d.completedSP, d.totalSP);
    renderIssueTypePie('chartIssueType', d.allMetrics);
    renderTimeChart('chartTime', d.sprintLabels, d.estimated, d.logged);
    renderPriorityRadar('chartPriority', d.pb);
  }, 50);
  bindEmployeeCards();
}

function renderEmployeesView() {
  viewContainer.innerHTML = renderEmployees();
  bindEmployeeCards();
  const filter = document.getElementById('empFilter');
  const deptFilter = document.getElementById('empDeptFilter');
  function applyFilters() {
    const q = (filter?.value || '').toLowerCase();
    const dept = deptFilter?.value || '';
    document.querySelectorAll('#empGrid .emp-card').forEach(c => {
      const txt = (c.querySelector('h3')?.textContent + c.querySelector('p')?.textContent).toLowerCase();
      const matchText = !q || txt.includes(q);
      const matchDept = !dept || txt.includes(dept.toLowerCase());
      c.style.display = matchText && matchDept ? '' : 'none';
    });
  }
  if (filter) filter.addEventListener('input', applyFilters);
  if (deptFilter) deptFilter.addEventListener('change', applyFilters);
}

function renderEmployeeDetailView(empId) {
  viewContainer.innerHTML = renderEmployeeDetail(empId);
  const d = getEmployeeChartData(empId);
  setTimeout(() => {
    renderVelocityChart('empVelocity', d.sprintLabels, d.completedSP, d.totalSP);
    renderIssueTypePie('empIssueType', d.m);
    renderTimeChart('empTimeChart', d.sprintLabels, d.estimated, d.logged);
    renderStatusBar('empStatusBar', d.m);
  }, 50);
  document.getElementById('backBtn')?.addEventListener('click', () => navigate('employees'));
}

function renderLeaderboardView() {
  viewContainer.innerHTML = renderLeaderboard();
  document.querySelectorAll('.podium-card[data-emp],.clickable-row[data-emp]').forEach(el => {
    el.addEventListener('click', () => navigate('employee-detail', el.dataset.emp));
  });
}

function renderSprintView() {
  viewContainer.innerHTML = renderSprintAnalysis();
  const bd = getBurndownData();
  setTimeout(() => renderBurndownChart('burndownChart', bd.days, bd.ideal, bd.actual), 50);
}

function renderIssuesView() {
  viewContainer.innerHTML = renderIssueTracker();
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const tbody = document.getElementById('issueTableBody');
      const filtered = filter === 'all' ? allIssues.slice(0, 80) : allIssues.filter(i => i.type === filter).slice(0, 80);
      tbody.innerHTML = filtered.map(i => {
        const emp = employees.find(e => e.id === i.assignee);
        const tc = i.type.toLowerCase();
        const sc = i.status.toLowerCase().replace(/ /g, '-');
        return `<tr><td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-secondary)">${i.id}</td><td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</td><td><span class="issue-type ${tc}">${i.type}</span></td><td><span class="status-badge ${sc}">${i.status}</span></td><td><span class="priority-dot ${i.priority.toLowerCase()}"></span>${i.priority}</td><td style="font-weight:600">${i.storyPoints}</td><td>${emp ? emp.name : '—'}</td></tr>`;
      }).join('');
    });
  });
}

function renderComparisonView(emp1Id, emp2Id) {
  const e1 = emp1Id || employees[0].id;
  const e2 = emp2Id || employees[1].id;
  viewContainer.innerHTML = renderComparison(e1, e2);

  // Set dropdowns
  const sel1 = document.getElementById('compEmp1');
  const sel2 = document.getElementById('compEmp2');
  if (sel1) sel1.value = e1;
  if (sel2) sel2.value = e2;

  // Render charts
  const cd = getComparisonChartData(e1, e2);
  setTimeout(() => {
    renderCompVelocity('compVelocityChart', cd.labels, cd.sp1, cd.sp2, cd.e1.name, cd.e2.name);
    renderCompRadar('compRadarChart', cd.s1, cd.s2, cd.e1.name, cd.e2.name);
  }, 50);

  // Compare button
  document.getElementById('compareBtn')?.addEventListener('click', () => {
    const v1 = document.getElementById('compEmp1')?.value;
    const v2 = document.getElementById('compEmp2')?.value;
    if (v1 && v2 && v1 !== v2) {
      renderComparisonView(v1, v2);
      showToast('Comparison updated', 'success');
    } else {
      showToast('Please select two different employees', 'error');
    }
  });
}

function renderTeamView() {
  viewContainer.innerHTML = renderTeamOverview();
  const td = getTeamChartData();
  setTimeout(() => renderTeamComparisonChart('teamCompChart', td.names, td.velocities, td.completionRates), 50);
  document.querySelectorAll('.team-member-row[data-emp]').forEach(row => {
    row.addEventListener('click', () => navigate('employee-detail', row.dataset.emp));
  });
}

function renderWorkloadView() {
  viewContainer.innerHTML = renderWorkload();
  const wd = getWorkloadChartData();
  setTimeout(() => renderWorkloadBar('workloadChart', wd.names, wd.activeIssues, wd.activeSP), 50);
  document.querySelectorAll('.workload-card[data-emp]').forEach(card => {
    card.addEventListener('click', () => navigate('employee-detail', card.dataset.emp));
  });
}

function renderTimelineView() {
  viewContainer.innerHTML = renderTimeline();
}

function renderExecutiveView() {
  viewContainer.innerHTML = renderExecutive();
  const d = getExecChartData();
  setTimeout(() => renderDeptVelocityChart('execDeptVelocity', d.labels, d.deptLabels, d.deptData, d.colors), 50);
}

function renderRetroView(sprintId) {
  viewContainer.innerHTML = renderSprintRetro(sprintId);
  const d = getRetroChartData(sprintId);
  setTimeout(() => {
    renderRetroTeamChart('retroTeamChart', d.teamData);
    renderRetroCarryChart('retroCarryChart', d.carryByType);
  }, 50);
  document.getElementById('retroSprintSelect')?.addEventListener('change', (e) => {
    renderRetroView(e.target.value);
    showToast('Sprint retrospective updated', 'info');
  });
}

function renderCapacityView() {
  viewContainer.innerHTML = renderCapacity();
  const d = getCapacityChartData();
  setTimeout(() => renderCapacityBarChart('capacityChart', d.labels, d.capacity, d.planned), 50);
}

function renderRiskView() {
  viewContainer.innerHTML = renderRisk();
  const d = getRiskChartData();
  setTimeout(() => {
    renderRiskTeamChart('riskTeamChart', d.teamLabels, d.teamValues);
    renderRiskAgeChart('riskAgeChart', d.ageLabels, d.ageValues);
  }, 50);
}

function renderOKRView() {
  viewContainer.innerHTML = renderOKR();
}

function renderPerformanceView(teamId) {
  viewContainer.innerHTML = renderPerformanceReview(teamId);
  bindEmployeeCards();
  document.getElementById('perfTeamSelect')?.addEventListener('change', (e) => {
    renderPerformanceView(e.target.value || null);
    showToast('Team filter updated', 'info');
  });
}

function renderBugQualityView() {
  viewContainer.innerHTML = renderBugQuality();
  const d = getBugChartData();
  setTimeout(() => {
    renderBugsBySprintChart('bugSprintChart', d.bugsBySprint);
    renderBugsByPriorityChart('bugPriorityChart', d.bugsByPriority);
  }, 50);
}

function renderSettingsView() {
  viewContainer.innerHTML = renderSettings();
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => { t.classList.toggle('active'); showToast('Setting updated', 'success'); });
  });
}

// ── Employee Card Click ──
function bindEmployeeCards() {
  document.querySelectorAll('.emp-card[data-emp]').forEach(card => {
    card.addEventListener('click', () => navigate('employee-detail', card.dataset.emp));
  });
}

// ── Sidebar Nav ──
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(item.dataset.view);
    document.getElementById('sidebar').classList.remove('open');
  });
});

// ── Mobile Menu ──
document.getElementById('mobileMenu')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── Theme Toggle ──
document.getElementById('themeToggle')?.addEventListener('click', () => {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('jirapulse-theme', isLight ? 'light' : 'dark');
  showToast(`Switched to ${isLight ? 'light' : 'dark'} mode`, 'info');
});
// Restore theme
if (localStorage.getItem('jirapulse-theme') === 'light') document.body.classList.add('light');

// ── Notifications ──
const notifs = generateNotifications();
notifBadge.textContent = notifs.length;

document.getElementById('notifBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  exportDropdown?.classList.remove('open');
  notifPanel.classList.toggle('open');
  if (notifPanel.classList.contains('open')) {
    notifPanel.innerHTML = `<div class="notif-panel-header"><h4>Notifications (${notifs.length})</h4><button id="clearNotifs">Mark all read</button></div>
    <div class="notif-list">${notifs.map(n => `<div class="notif-item notif-type-${n.type}" ${n.empId ? `data-emp="${n.empId}"` : ''}><div class="notif-icon">${n.icon}</div><div class="notif-body"><div class="notif-msg">${n.msg}</div><div class="notif-time">${n.time}</div></div></div>`).join('')}</div>`;
    document.getElementById('clearNotifs')?.addEventListener('click', () => {
      notifBadge.style.display = 'none';
      showToast('All notifications marked as read', 'success');
    });
    notifPanel.querySelectorAll('.notif-item[data-emp]').forEach(item => {
      item.addEventListener('click', () => {
        notifPanel.classList.remove('open');
        navigate('employee-detail', item.dataset.emp);
      });
    });
  }
});

// ── Export Dropdown ──
document.getElementById('exportBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  notifPanel?.classList.remove('open');
  exportDropdown.classList.toggle('open');
});
document.querySelectorAll('.export-option').forEach(btn => {
  btn.addEventListener('click', () => {
    exportToCSV(btn.dataset.export);
    exportDropdown.classList.remove('open');
    showToast(`Exported ${btn.dataset.export} data as CSV`, 'success');
  });
});

// ── Close dropdowns on outside click ──
document.addEventListener('click', () => {
  notifPanel?.classList.remove('open');
  exportDropdown?.classList.remove('open');
});

// ── Search Modal ──
document.getElementById('searchBox')?.addEventListener('click', () => openSearch());
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});
searchModal?.addEventListener('click', (e) => { if (e.target === searchModal) closeSearch(); });

function openSearch() {
  searchModal.classList.add('active');
  modalSearchInput.value = '';
  modalSearchInput.focus();
  searchResults.innerHTML = '<div class="search-empty">Type to search across all data...</div>';
}
function closeSearch() { searchModal.classList.remove('active'); }

modalSearchInput?.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  if (q.length < 2) { searchResults.innerHTML = '<div class="search-empty">Type to search across all data...</div>'; return; }
  const results = searchData(q);
  if (results.length === 0) { searchResults.innerHTML = '<div class="search-empty">No results found</div>'; return; }
  searchResults.innerHTML = results.map(r => `<div class="search-result-item" data-type="${r.type}" data-id="${r.id}"><div class="sr-icon" style="background:${r.color}">${r.avatar}</div><div class="sr-info"><div class="sr-title">${r.title}</div><div class="sr-sub">${r.sub}</div></div></div>`).join('');
  searchResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => { closeSearch(); if (item.dataset.type === 'employee') navigate('employee-detail', item.dataset.id); });
  });
});

// ── Refresh ──
document.getElementById('refreshBtn')?.addEventListener('click', async () => {
  showToast('Syncing data...', 'info');
  if (backendMode) {
    const result = await triggerSync();
    if (result) {
      showToast(`Synced: ${result.issues || 0} issues, ${result.employees || 0} employees`, 'success');
    } else {
      showToast('Sync failed – check Jira configuration', 'error');
    }
  }
  navigate(currentView, selectedEmployee);
});

// ── Toast ──
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── Init ──
async function init() {
  // Check backend
  const health = await checkHealth();
  if (health) {
    backendMode = true;
    const statusEl = document.querySelector('.connection-status span');
    if (statusEl) statusEl.textContent = health.jira_connected ? 'Jira Connected' : 'Demo Mode';
    showToast(`Backend connected (${health.total_cached_issues} issues cached)`, 'success');
  } else {
    const statusEl = document.querySelector('.connection-status span');
    if (statusEl) statusEl.textContent = 'Frontend Only';
  }
  navigate('dashboard');
}

init();
