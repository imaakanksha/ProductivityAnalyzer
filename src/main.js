import './style.css';
import { renderDashboard, getDashboardChartData, renderEmployees, renderEmployeeDetail, getEmployeeChartData, renderSprintAnalysis, getBurndownData, renderIssueTracker, renderTeamOverview, getTeamChartData, renderSettings, searchData } from './views.js';
import { renderVelocityChart, renderIssueTypePie, renderTimeChart, renderPriorityRadar, renderStatusBar, renderBurndownChart, renderTeamComparisonChart, destroyAll } from './charts.js';
import { employees, allIssues } from './data.js';

// ── State ──
let currentView = 'dashboard';
let selectedEmployee = null;

// ── DOM Refs ──
const viewContainer = document.getElementById('viewContainer');
const breadcrumb = document.getElementById('breadcrumb');
const searchModal = document.getElementById('searchModal');
const modalSearchInput = document.getElementById('modalSearchInput');
const searchResults = document.getElementById('searchResults');
const toastContainer = document.getElementById('toastContainer');

// ── Navigation ──
function navigate(view, empId = null) {
  destroyAll();
  currentView = view;
  selectedEmployee = empId;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`[data-view="${view}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Update breadcrumb
  let bcText = view.charAt(0).toUpperCase() + view.slice(1);
  if (view === 'employee-detail') {
    const emp = employees.find(e => e.id === empId);
    bcText = emp ? emp.name : 'Employee';
  }
  breadcrumb.innerHTML = `<span class="bc-item">JiraPulse</span><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span class="bc-item active">${bcText}</span>`;

  // Render view
  switch (view) {
    case 'dashboard': renderDashboardView(); break;
    case 'employees': renderEmployeesView(); break;
    case 'employee-detail': renderEmployeeDetailView(empId); break;
    case 'sprints': renderSprintView(); break;
    case 'issues': renderIssuesView(); break;
    case 'team': renderTeamView(); break;
    case 'settings': renderSettingsView(); break;
  }

  // Animate in
  viewContainer.style.animation = 'none';
  viewContainer.offsetHeight; // reflow
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
  if (filter) {
    filter.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const grid = document.getElementById('empGrid');
      const cards = grid.querySelectorAll('.emp-card');
      cards.forEach(c => {
        const name = c.querySelector('h3').textContent.toLowerCase();
        const role = c.querySelector('p').textContent.toLowerCase();
        c.style.display = (name.includes(q) || role.includes(q)) ? '' : 'none';
      });
    });
  }
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

function renderTeamView() {
  viewContainer.innerHTML = renderTeamOverview();
  const td = getTeamChartData();
  setTimeout(() => renderTeamComparisonChart('teamCompChart', td.names, td.velocities, td.completionRates), 50);
  document.querySelectorAll('.team-member-row[data-emp]').forEach(row => {
    row.addEventListener('click', () => navigate('employee-detail', row.dataset.emp));
  });
}

function renderSettingsView() {
  viewContainer.innerHTML = renderSettings();
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => {
      t.classList.toggle('active');
      showToast('Setting updated', 'success');
    });
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
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
  });
});

// ── Mobile Menu ──
document.getElementById('mobileMenu')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── Sidebar Toggle ──
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
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
  if (q.length < 2) {
    searchResults.innerHTML = '<div class="search-empty">Type to search across all data...</div>';
    return;
  }
  const results = searchData(q);
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-empty">No results found</div>';
    return;
  }
  searchResults.innerHTML = results.map(r => `
    <div class="search-result-item" data-type="${r.type}" data-id="${r.id}">
      <div class="sr-icon" style="background:${r.color}">${r.avatar}</div>
      <div class="sr-info"><div class="sr-title">${r.title}</div><div class="sr-sub">${r.sub}</div></div>
    </div>`).join('');
  searchResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      closeSearch();
      if (item.dataset.type === 'employee') navigate('employee-detail', item.dataset.id);
    });
  });
});

// ── Refresh & Export ──
document.getElementById('refreshBtn')?.addEventListener('click', () => {
  showToast('Data refreshed successfully', 'success');
  navigate(currentView, selectedEmployee);
});
document.getElementById('exportBtn')?.addEventListener('click', () => {
  showToast('Report exported as CSV', 'info');
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
navigate('dashboard');
