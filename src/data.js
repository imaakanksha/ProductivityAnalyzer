// ──────────────────────────────────────────────
// Mock Jira Data – Realistic Employee Productivity Data
// ──────────────────────────────────────────────

const teams = ['Platform Engineering', 'Frontend Squad', 'Backend Services', 'DevOps & SRE', 'Data Engineering', 'QA Automation'];

const issueStatuses = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];
const issueTypes = ['Story', 'Task', 'Bug', 'Sub-task', 'Epic'];

const employees = [
  { id: 'EMP001', name: 'Aarav Sharma', avatar: 'AS', role: 'Senior Software Engineer', team: 'Platform Engineering', email: 'aarav.sharma@company.com', joinDate: '2022-03-15' },
  { id: 'EMP002', name: 'Priya Patel', avatar: 'PP', role: 'Tech Lead', team: 'Frontend Squad', email: 'priya.patel@company.com', joinDate: '2021-01-10' },
  { id: 'EMP003', name: 'Rahul Verma', avatar: 'RV', role: 'Full Stack Developer', team: 'Backend Services', email: 'rahul.verma@company.com', joinDate: '2023-06-20' },
  { id: 'EMP004', name: 'Sneha Gupta', avatar: 'SG', role: 'DevOps Engineer', team: 'DevOps & SRE', email: 'sneha.gupta@company.com', joinDate: '2022-09-01' },
  { id: 'EMP005', name: 'Vikram Singh', avatar: 'VS', role: 'Data Engineer', team: 'Data Engineering', email: 'vikram.singh@company.com', joinDate: '2023-01-15' },
  { id: 'EMP006', name: 'Ananya Reddy', avatar: 'AR', role: 'QA Lead', team: 'QA Automation', email: 'ananya.reddy@company.com', joinDate: '2021-07-25' },
  { id: 'EMP007', name: 'Karthik Nair', avatar: 'KN', role: 'Software Engineer', team: 'Platform Engineering', email: 'karthik.nair@company.com', joinDate: '2024-02-10' },
  { id: 'EMP008', name: 'Meera Joshi', avatar: 'MJ', role: 'Frontend Developer', team: 'Frontend Squad', email: 'meera.joshi@company.com', joinDate: '2023-11-05' },
  { id: 'EMP009', name: 'Arjun Kumar', avatar: 'AK', role: 'Backend Developer', team: 'Backend Services', email: 'arjun.kumar@company.com', joinDate: '2022-05-18' },
  { id: 'EMP010', name: 'Divya Iyer', avatar: 'DI', role: 'SRE Engineer', team: 'DevOps & SRE', email: 'divya.iyer@company.com', joinDate: '2023-08-12' },
  { id: 'EMP011', name: 'Rohan Mehta', avatar: 'RM', role: 'ML Engineer', team: 'Data Engineering', email: 'rohan.mehta@company.com', joinDate: '2024-01-08' },
  { id: 'EMP012', name: 'Neha Kapoor', avatar: 'NK', role: 'Automation Engineer', team: 'QA Automation', email: 'neha.kapoor@company.com', joinDate: '2022-12-01' },
];

// Generate sprint data
function generateSprints() {
  const sprints = [];
  const sprintNames = [
    'Sprint 2025-Q4-1', 'Sprint 2025-Q4-2', 'Sprint 2025-Q4-3',
    'Sprint 2026-Q1-1', 'Sprint 2026-Q1-2', 'Sprint 2026-Q1-3',
    'Sprint 2026-Q2-1', 'Sprint 2026-Q2-2'
  ];
  let startDate = new Date('2025-10-06');
  sprintNames.forEach((name, i) => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 13);
    sprints.push({
      id: `SPR-${String(i + 1).padStart(3, '0')}`,
      name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      status: i < 7 ? 'Completed' : 'Active',
    });
    startDate = new Date(end);
    startDate.setDate(startDate.getDate() + 1);
  });
  return sprints;
}

// Seed-based deterministic random
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate issues for each employee across sprints
function generateIssues(sprints) {
  const issues = [];
  let issueCounter = 1;

  const projectKeys = ['PLAT', 'FRONT', 'BACK', 'OPS', 'DATA', 'QA'];
  const storyTitles = [
    'Implement user authentication flow', 'Refactor database connection pooling',
    'Add real-time notification system', 'Optimize search query performance',
    'Build CI/CD pipeline for microservice', 'Create dashboard analytics widgets',
    'Implement caching layer for API', 'Design responsive navigation component',
    'Set up monitoring and alerting', 'Build data ingestion pipeline',
    'Automate regression test suite', 'Implement rate limiting middleware',
    'Add dark mode support', 'Optimize bundle size', 'Create API documentation',
    'Implement WebSocket connections', 'Build file upload service',
    'Add internationalization support', 'Create error tracking integration',
    'Implement feature flags system', 'Build user preference service',
    'Optimize database queries', 'Create data visualization components',
    'Implement OAuth2 integration', 'Build audit logging system',
    'Add performance monitoring', 'Create automated deployment scripts',
    'Implement data export functionality', 'Build notification preferences',
    'Add accessibility compliance', 'Implement search autocomplete',
    'Build metrics collection service', 'Create load testing framework',
    'Implement retry mechanism', 'Build health check endpoints',
  ];

  employees.forEach((emp, empIdx) => {
    const rng = seededRandom(empIdx * 1000 + 42);
    const pkIdx = empIdx % projectKeys.length;
    const projKey = projectKeys[pkIdx];

    sprints.forEach((sprint, sprintIdx) => {
      const issueCount = Math.floor(rng() * 5) + 4; // 4-8 issues per sprint
      for (let i = 0; i < issueCount; i++) {
        const typeIdx = Math.floor(rng() * issueTypes.length);
        const type = issueTypes[typeIdx];
        const storyPoints = type === 'Epic' ? Math.floor(rng() * 8 + 8) :
          type === 'Bug' ? Math.floor(rng() * 3 + 1) :
            type === 'Sub-task' ? Math.floor(rng() * 2 + 1) :
              Math.floor(rng() * 5 + 2);

        const completionRate = 0.6 + empIdx * 0.025 + sprintIdx * 0.015;
        const isCompleted = rng() < Math.min(completionRate, 0.95);
        const statusOptions = isCompleted ? ['Done'] :
          sprint.status === 'Active' ? ['In Progress', 'In Review', 'To Do'] :
            ['Done', 'In Progress', 'Blocked'];
        const status = statusOptions[Math.floor(rng() * statusOptions.length)];

        const titleIdx = Math.floor(rng() * storyTitles.length);
        const priority = priorities[Math.floor(rng() * priorities.length)];

        // Generate realistic log hours
        const estimatedHours = storyPoints * (1.5 + rng() * 1.5);
        const loggedHours = isCompleted ?
          estimatedHours * (0.7 + rng() * 0.6) :
          estimatedHours * (rng() * 0.5);

        // Generate created/updated dates within sprint
        const sprintStart = new Date(sprint.startDate);
        const sprintEnd = new Date(sprint.endDate);
        const createdDate = new Date(sprintStart.getTime() + rng() * (sprintEnd.getTime() - sprintStart.getTime()) * 0.3);
        const updatedDate = new Date(createdDate.getTime() + rng() * (sprintEnd.getTime() - createdDate.getTime()));

        issues.push({
          id: `${projKey}-${issueCounter++}`,
          title: storyTitles[titleIdx],
          type,
          status,
          priority,
          storyPoints,
          assignee: emp.id,
          sprint: sprint.id,
          sprintName: sprint.name,
          estimatedHours: Math.round(estimatedHours * 10) / 10,
          loggedHours: Math.round(loggedHours * 10) / 10,
          createdDate: createdDate.toISOString().split('T')[0],
          updatedDate: updatedDate.toISOString().split('T')[0],
          labels: generateLabels(rng),
          commentsCount: Math.floor(rng() * 12),
          subtaskCount: type === 'Story' || type === 'Epic' ? Math.floor(rng() * 5) : 0,
        });
      }
    });
  });

  return issues;
}

function generateLabels(rng) {
  const allLabels = ['performance', 'security', 'refactor', 'feature', 'tech-debt', 'documentation', 'ux', 'backend', 'frontend', 'infrastructure'];
  const count = Math.floor(rng() * 3);
  const labels = [];
  for (let i = 0; i < count; i++) {
    const label = allLabels[Math.floor(rng() * allLabels.length)];
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}

// Generate daily activity data for heatmap
function generateActivityData(empId) {
  const rng = seededRandom(parseInt(empId.replace('EMP', '')) * 777);
  const activities = [];
  const startDate = new Date('2025-10-01');
  const endDate = new Date('2026-05-04');

  let current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Weekdays only
      const activityLevel = Math.floor(rng() * 10) + (rng() > 0.3 ? 2 : 0);
      activities.push({
        date: current.toISOString().split('T')[0],
        commits: Math.floor(rng() * 8),
        issuesUpdated: Math.floor(rng() * 6) + 1,
        hoursLogged: Math.round((rng() * 6 + 2) * 10) / 10,
        activityLevel: Math.min(activityLevel, 10),
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return activities;
}

// Pre-generate data
const sprints = generateSprints();
const allIssues = generateIssues(sprints);

export { employees, teams, sprints, allIssues, issueTypes, issueStatuses, priorities, generateActivityData };

// Helper functions for computing metrics
export function getEmployeeIssues(empId) {
  return allIssues.filter(i => i.assignee === empId);
}

export function getSprintMetrics(empId, sprintId) {
  const issues = allIssues.filter(i => i.assignee === empId && i.sprint === sprintId);
  const completed = issues.filter(i => i.status === 'Done');
  return {
    totalIssues: issues.length,
    completedIssues: completed.length,
    completionRate: issues.length > 0 ? Math.round((completed.length / issues.length) * 100) : 0,
    totalStoryPoints: issues.reduce((s, i) => s + i.storyPoints, 0),
    completedStoryPoints: completed.reduce((s, i) => s + i.storyPoints, 0),
    totalLoggedHours: Math.round(issues.reduce((s, i) => s + i.loggedHours, 0) * 10) / 10,
    bugCount: issues.filter(i => i.type === 'Bug').length,
    storyCount: issues.filter(i => i.type === 'Story').length,
    taskCount: issues.filter(i => i.type === 'Task').length,
  };
}

export function getOverallMetrics(empId) {
  const issues = getEmployeeIssues(empId);
  const completed = issues.filter(i => i.status === 'Done');
  const totalSP = issues.reduce((s, i) => s + i.storyPoints, 0);
  const completedSP = completed.reduce((s, i) => s + i.storyPoints, 0);
  const totalLogged = issues.reduce((s, i) => s + i.loggedHours, 0);
  const totalEstimated = issues.reduce((s, i) => s + i.estimatedHours, 0);

  return {
    totalIssues: issues.length,
    completedIssues: completed.length,
    completionRate: issues.length > 0 ? Math.round((completed.length / issues.length) * 100) : 0,
    totalStoryPoints: totalSP,
    completedStoryPoints: completedSP,
    avgVelocity: Math.round(completedSP / sprints.length),
    totalLoggedHours: Math.round(totalLogged * 10) / 10,
    totalEstimatedHours: Math.round(totalEstimated * 10) / 10,
    efficiency: totalEstimated > 0 ? Math.round((totalEstimated / Math.max(totalLogged, 1)) * 100) : 0,
    bugCount: issues.filter(i => i.type === 'Bug').length,
    storyCount: issues.filter(i => i.type === 'Story').length,
    taskCount: issues.filter(i => i.type === 'Task').length,
    epicCount: issues.filter(i => i.type === 'Epic').length,
    subtaskCount: issues.filter(i => i.type === 'Sub-task').length,
    avgCycleTime: Math.round((2 + Math.random() * 3) * 10) / 10,
    blockedIssues: issues.filter(i => i.status === 'Blocked').length,
    inProgressIssues: issues.filter(i => i.status === 'In Progress').length,
    priorityBreakdown: {
      critical: issues.filter(i => i.priority === 'Critical').length,
      high: issues.filter(i => i.priority === 'High').length,
      medium: issues.filter(i => i.priority === 'Medium').length,
      low: issues.filter(i => i.priority === 'Low').length,
    },
  };
}
