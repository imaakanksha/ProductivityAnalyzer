import Chart from 'chart.js/auto';

// ── Shared Chart Defaults ──
Chart.defaults.color = '#8b8da3';
Chart.defaults.borderColor = '#ffffff0d';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = '#1e2030ee';
Chart.defaults.plugins.tooltip.borderColor = '#ffffff1a';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };
Chart.defaults.elements.bar.borderRadius = 6;
Chart.defaults.elements.line.tension = 0.35;
Chart.defaults.scale.grid = { color: '#ffffff08' };

const COLORS = {
  accent: '#6C5CE7', accentLight: '#a388ee',
  cyan: '#00B4D8', green: '#00C9A7',
  amber: '#FFB347', rose: '#FF6B8A', purple: '#A78BFA',
};
const PALETTE = [COLORS.accent, COLORS.cyan, COLORS.green, COLORS.amber, COLORS.rose, COLORS.purple];

// Store chart instances for cleanup
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function createChart(canvasId, config) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  chartInstances[canvasId] = new Chart(ctx, config);
  return chartInstances[canvasId];
}

// ── Velocity Chart (line) ──
export function renderVelocityChart(canvasId, sprintLabels, completedSP, totalSP) {
  return createChart(canvasId, {
    type: 'line',
    data: {
      labels: sprintLabels,
      datasets: [
        {
          label: 'Completed SP',
          data: completedSP,
          borderColor: COLORS.accent,
          backgroundColor: COLORS.accent + '20',
          fill: true,
          pointBackgroundColor: COLORS.accent,
          pointRadius: 4, pointHoverRadius: 6,
        },
        {
          label: 'Committed SP',
          data: totalSP,
          borderColor: COLORS.cyan,
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          pointBackgroundColor: COLORS.cyan,
          pointRadius: 3, pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } },
    },
  });
}

// ── Issue Type Doughnut ──
export function renderIssueTypePie(canvasId, data) {
  return createChart(canvasId, {
    type: 'doughnut',
    data: {
      labels: ['Stories', 'Tasks', 'Bugs', 'Epics', 'Sub-tasks'],
      datasets: [{
        data: [data.storyCount, data.taskCount, data.bugCount, data.epicCount, data.subtaskCount],
        backgroundColor: [COLORS.accent, COLORS.cyan, COLORS.rose, COLORS.purple, COLORS.amber],
        borderWidth: 0, hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { position: 'bottom', labels: { padding: 12 } } },
    },
  });
}

// ── Status Horizontal Bar ──
export function renderStatusBar(canvasId, metrics) {
  const issues = metrics;
  const done = issues.completedIssues || 0;
  const inProg = issues.inProgressIssues || 0;
  const blocked = issues.blockedIssues || 0;
  const other = issues.totalIssues - done - inProg - blocked;
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels: ['Done', 'In Progress', 'Blocked', 'Other'],
      datasets: [{
        data: [done, inProg, blocked, Math.max(other, 0)],
        backgroundColor: [COLORS.green, COLORS.cyan, COLORS.rose, '#5a5c72'],
        borderWidth: 0, barThickness: 28,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true }, y: { grid: { display: false } } },
    },
  });
}

// ── Time Tracking Bar ──
export function renderTimeChart(canvasId, sprintLabels, estimated, logged) {
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels: sprintLabels,
      datasets: [
        { label: 'Estimated (hrs)', data: estimated, backgroundColor: COLORS.purple + '80', borderWidth: 0 },
        { label: 'Logged (hrs)', data: logged, backgroundColor: COLORS.cyan + '80', borderWidth: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// ── Priority Radar ──
export function renderPriorityRadar(canvasId, pb) {
  return createChart(canvasId, {
    type: 'radar',
    data: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        label: 'Issues',
        data: [pb.critical, pb.high, pb.medium, pb.low],
        backgroundColor: COLORS.accent + '30',
        borderColor: COLORS.accent,
        pointBackgroundColor: COLORS.accent,
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { r: { beginAtZero: true, grid: { color: '#ffffff10' }, angleLines: { color: '#ffffff10' }, pointLabels: { font: { size: 11 } } } },
      plugins: { legend: { display: false } },
    },
  });
}

// ── Team Comparison Bar ──
export function renderTeamComparisonChart(canvasId, names, velocities, completionRates) {
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [
        { label: 'Avg Velocity (SP)', data: velocities, backgroundColor: COLORS.accent + '90', borderWidth: 0 },
        { label: 'Completion %', data: completionRates, backgroundColor: COLORS.cyan + '90', borderWidth: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// ── Sprint Burndown ──
export function renderBurndownChart(canvasId, days, ideal, actual) {
  return createChart(canvasId, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        { label: 'Ideal', data: ideal, borderColor: COLORS.cyan, borderDash: [6, 4], backgroundColor: 'transparent', pointRadius: 0 },
        { label: 'Actual', data: actual, borderColor: COLORS.accent, backgroundColor: COLORS.accent + '15', fill: true, pointRadius: 3, pointBackgroundColor: COLORS.accent },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

export function destroyAll() {
  Object.keys(chartInstances).forEach(destroyChart);
}

// ── Comparison Velocity ──
export function renderCompVelocity(canvasId, labels, sp1, sp2, name1, name2) {
  return createChart(canvasId, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: name1, data: sp1, borderColor: COLORS.accent, backgroundColor: COLORS.accent + '15', fill: true, pointRadius: 4, pointBackgroundColor: COLORS.accent },
        { label: name2, data: sp2, borderColor: COLORS.cyan, backgroundColor: COLORS.cyan + '15', fill: true, pointRadius: 4, pointBackgroundColor: COLORS.cyan },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } },
  });
}

// ── Comparison Radar ──
export function renderCompRadar(canvasId, s1, s2, name1, name2) {
  return createChart(canvasId, {
    type: 'radar',
    data: {
      labels: ['Completion', 'Velocity', 'Efficiency', 'Consistency'],
      datasets: [
        { label: name1, data: [s1.completion, s1.velocity, s1.efficiency, s1.consistency], backgroundColor: COLORS.accent + '30', borderColor: COLORS.accent, pointBackgroundColor: COLORS.accent, pointRadius: 4 },
        { label: name2, data: [s2.completion, s2.velocity, s2.efficiency, s2.consistency], backgroundColor: COLORS.cyan + '30', borderColor: COLORS.cyan, pointBackgroundColor: COLORS.cyan, pointRadius: 4 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100, grid: { color: '#ffffff10' }, angleLines: { color: '#ffffff10' } } }, plugins: { legend: { position: 'top' } } },
  });
}

// ── Workload Bar ──
export function renderWorkloadBar(canvasId, names, activeIssues, activeSP) {
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [
        { label: 'Active Issues', data: activeIssues, backgroundColor: COLORS.accent + '80', borderWidth: 0, yAxisID: 'y' },
        { label: 'Remaining SP', data: activeSP, backgroundColor: COLORS.amber + '80', borderWidth: 0, yAxisID: 'y1' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Issues' } }, y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Story Points' } } },
    },
  });
}

// ── Enterprise: Department Velocity ──
export function renderDeptVelocityChart(canvasId, labels, deptLabels, deptData, colors) {
  return createChart(canvasId, {
    type: 'line',
    data: {
      labels,
      datasets: deptLabels.map((name, i) => ({
        label: name, data: deptData[i],
        borderColor: colors[i], backgroundColor: colors[i] + '10',
        fill: false, pointRadius: 3, pointBackgroundColor: colors[i], borderWidth: 2,
      })),
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } },
  });
}

// ── Enterprise: Retro Team Chart ──
export function renderRetroTeamChart(canvasId, teamData) {
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels: teamData.map(t => t.name),
      datasets: [
        { label: 'Completed', data: teamData.map(t => t.done), backgroundColor: COLORS.green + '80', borderWidth: 0 },
        { label: 'Not Done', data: teamData.map(t => t.notDone), backgroundColor: COLORS.rose + '60', borderWidth: 0 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } },
  });
}

// ── Enterprise: Retro Carry-Over ──
export function renderRetroCarryChart(canvasId, carryByType) {
  return createChart(canvasId, {
    type: 'doughnut',
    data: {
      labels: Object.keys(carryByType),
      datasets: [{ data: Object.values(carryByType), backgroundColor: [COLORS.accent, COLORS.cyan, COLORS.rose, COLORS.purple, COLORS.amber], borderWidth: 0, hoverOffset: 8 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' } } },
  });
}

// ── Enterprise: Capacity Bar ──
export function renderCapacityBarChart(canvasId, labels, capacity, planned) {
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Capacity (hrs)', data: capacity, backgroundColor: COLORS.green + '50', borderColor: COLORS.green, borderWidth: 1 },
        { label: 'Planned (hrs)', data: planned, backgroundColor: COLORS.accent + '70', borderColor: COLORS.accent, borderWidth: 1 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } } },
  });
}

// ── Enterprise: Risk by Team ──
export function renderRiskTeamChart(canvasId, labels, values) {
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Blocked Issues', data: values, backgroundColor: COLORS.rose + '70', borderColor: COLORS.rose, borderWidth: 1, barThickness: 20 }],
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true }, y: { grid: { display: false } } } },
  });
}

// ── Enterprise: Risk Age Distribution ──
export function renderRiskAgeChart(canvasId, labels, values) {
  return createChart(canvasId, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Issues', data: values, backgroundColor: [COLORS.green + '80', COLORS.cyan + '80', COLORS.amber + '80', COLORS.rose + '80', '#ff2d5570'], borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}
