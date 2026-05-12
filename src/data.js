// ──────────────────────────────────────────────
// Enterprise Mock Data – 120 Employees, 8 Departments, 20 Teams
// ──────────────────────────────────────────────

const departments = [
  { id: 'DEPT01', name: 'Platform Engineering', head: 'VP Engineering', color: '#6C5CE7' },
  { id: 'DEPT02', name: 'Product Development', head: 'VP Product', color: '#00B4D8' },
  { id: 'DEPT03', name: 'Cloud & Infrastructure', head: 'VP Infrastructure', color: '#00C9A7' },
  { id: 'DEPT04', name: 'Data & Analytics', head: 'VP Data', color: '#FFB347' },
  { id: 'DEPT05', name: 'Quality Assurance', head: 'VP Quality', color: '#FF6B8A' },
  { id: 'DEPT06', name: 'Security & Compliance', head: 'CISO', color: '#A78BFA' },
  { id: 'DEPT07', name: 'Mobile Engineering', head: 'VP Mobile', color: '#F97316' },
  { id: 'DEPT08', name: 'AI & Machine Learning', head: 'VP AI/ML', color: '#14B8A6' },
];

const teams = [
  { id: 'T01', name: 'Platform Core', dept: 'DEPT01', manager: 'EMP001' },
  { id: 'T02', name: 'Platform APIs', dept: 'DEPT01', manager: 'EMP002' },
  { id: 'T03', name: 'Frontend Web', dept: 'DEPT02', manager: 'EMP003' },
  { id: 'T04', name: 'Frontend Design Systems', dept: 'DEPT02', manager: 'EMP004' },
  { id: 'T05', name: 'Backend Microservices', dept: 'DEPT02', manager: 'EMP005' },
  { id: 'T06', name: 'DevOps & SRE', dept: 'DEPT03', manager: 'EMP006' },
  { id: 'T07', name: 'Cloud Platform', dept: 'DEPT03', manager: 'EMP007' },
  { id: 'T08', name: 'Data Pipeline', dept: 'DEPT04', manager: 'EMP008' },
  { id: 'T09', name: 'Business Intelligence', dept: 'DEPT04', manager: 'EMP009' },
  { id: 'T10', name: 'QA Automation', dept: 'DEPT05', manager: 'EMP010' },
  { id: 'T11', name: 'Performance Testing', dept: 'DEPT05', manager: 'EMP011' },
  { id: 'T12', name: 'Application Security', dept: 'DEPT06', manager: 'EMP012' },
  { id: 'T13', name: 'Compliance & Audit', dept: 'DEPT06', manager: 'EMP013' },
  { id: 'T14', name: 'iOS Engineering', dept: 'DEPT07', manager: 'EMP014' },
  { id: 'T15', name: 'Android Engineering', dept: 'DEPT07', manager: 'EMP015' },
  { id: 'T16', name: 'ML Platform', dept: 'DEPT08', manager: 'EMP016' },
  { id: 'T17', name: 'NLP & Search', dept: 'DEPT08', manager: 'EMP017' },
  { id: 'T18', name: 'Payments & Billing', dept: 'DEPT02', manager: 'EMP018' },
  { id: 'T19', name: 'Identity & Access', dept: 'DEPT06', manager: 'EMP019' },
  { id: 'T20', name: 'Observability', dept: 'DEPT03', manager: 'EMP020' },
];

const issueStatuses = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];
const issueTypes = ['Story', 'Task', 'Bug', 'Sub-task', 'Epic'];

const firstNames = ['Aarav','Priya','Rahul','Sneha','Vikram','Ananya','Karthik','Meera','Arjun','Divya','Rohan','Neha','Aditya','Pooja','Siddharth','Kavita','Manish','Ritika','Deepak','Swati','Amit','Nisha','Rajesh','Sunita','Vivek','Anjali','Gaurav','Megha','Nikhil','Pallavi','Suresh','Tanvi','Harsh','Komal','Pranav','Bhavna','Sachin','Jyoti','Akash','Ritu','Varun','Shweta','Tushar','Archana','Mohit','Preeti','Kunal','Garima','Ramesh','Aparna','Nilesh','Sonal','Vishal','Madhuri','Ashish','Seema','Tarun','Chitra','Pankaj','Rekha','Naveen','Smita','Manoj','Lata','Girish','Usha','Hemant','Vrinda','Dinesh','Padma','Sameer','Alka','Vijay','Manju','Ravi','Sapna','Arun','Geeta','Sunil','Anita','Ajay','Kamla','Dev','Meena','Sanjay','Radha','Prakash','Indira','Lokesh','Sheela','Dhruv','Namita','Yash','Juhi','Aniket','Prerna','Chirag','Dimple','Omkar','Tanya','Ishaan','Shruti','Kabir','Disha','Reyansh','Kiara','Advait','Aisha','Aryan','Myra','Vihaan','Sara','Atharv','Anvi'];

const lastNames = ['Sharma','Patel','Verma','Gupta','Singh','Reddy','Nair','Joshi','Kumar','Iyer','Mehta','Kapoor','Chopra','Banerjee','Desai','Malhotra','Agarwal','Bose','Chauhan','Dhawan','Thakur','Pillai','Rao','Mishra','Saxena','Tiwari','Pandey','Bhatt','Kulkarni','Srinivasan','Menon','Das','Sen','Ghosh','Mukherjee','Chatterjee','Roy','Dutta','Sethi','Khanna','Ahuja','Bhatia','Chawla','Grover','Yadav','Jain','Mahajan','Sood','Kaul','Rajan','Naidu','Hegde','Nayak','Patil','Gowda','Mistry','Trivedi','Shah','Modi','Parikh'];

const roles = ['Software Engineer','Senior Software Engineer','Staff Engineer','Principal Engineer','Tech Lead','Engineering Manager','Senior Manager','Director','QA Engineer','Senior QA Engineer','QA Lead','DevOps Engineer','Senior DevOps Engineer','SRE Engineer','Data Engineer','Senior Data Engineer','ML Engineer','Senior ML Engineer','Security Engineer','Senior Security Engineer','Frontend Developer','Senior Frontend Developer','Backend Developer','Senior Backend Developer','Mobile Developer','Senior Mobile Developer','Full Stack Developer','Product Manager','Senior Product Manager','Architect','Senior Architect'];

// Seed-based deterministic random
function seededRandom(seed) {
  let s = seed;
  return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Generate 120 employees across 20 teams
function generateEmployees() {
  const emps = [];
  const rng = seededRandom(42);
  const teamSizes = {};
  teams.forEach(t => { teamSizes[t.id] = 0; });

  for (let i = 0; i < 120; i++) {
    const id = `EMP${String(i + 1).padStart(3, '0')}`;
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(rng() * lastNames.length)];
    const teamIdx = i % teams.length;
    const team = teams[teamIdx];
    teamSizes[team.id]++;
    const seniorityLevel = rng();
    const role = i < 20 ? roles[Math.min(i, roles.length - 1)] :
      roles[Math.floor(rng() * roles.length)];
    const joinYear = 2020 + Math.floor(rng() * 6);
    const joinMonth = String(Math.floor(rng() * 12) + 1).padStart(2, '0');
    const joinDay = String(Math.floor(rng() * 28) + 1).padStart(2, '0');
    const isManager = i < 20;

    emps.push({
      id,
      name: `${fn} ${ln}`,
      avatar: `${fn[0]}${ln[0]}`,
      role,
      team: team.name,
      teamId: team.id,
      department: departments.find(d => d.id === team.dept)?.name || '',
      departmentId: team.dept,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@enterprise.com`,
      joinDate: `${joinYear}-${joinMonth}-${joinDay}`,
      isManager,
      managerId: isManager ? null : teams[teamIdx].manager,
      level: isManager ? 'L6+' : seniorityLevel > 0.7 ? 'L5' : seniorityLevel > 0.4 ? 'L4' : 'L3',
    });
  }
  return emps;
}

// Generate sprints
function generateSprints() {
  const sprints = [];
  const names = [
    'Sprint 2025-Q3-1','Sprint 2025-Q3-2','Sprint 2025-Q3-3',
    'Sprint 2025-Q4-1','Sprint 2025-Q4-2','Sprint 2025-Q4-3',
    'Sprint 2026-Q1-1','Sprint 2026-Q1-2','Sprint 2026-Q1-3',
    'Sprint 2026-Q2-1','Sprint 2026-Q2-2','Sprint 2026-Q2-3',
  ];
  let startDate = new Date('2025-07-07');
  names.forEach((name, i) => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 13);
    sprints.push({
      id: `SPR-${String(i + 1).padStart(3, '0')}`,
      name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      status: i < 11 ? 'Completed' : 'Active',
      goal: sprintGoals[i % sprintGoals.length],
    });
    startDate = new Date(end);
    startDate.setDate(startDate.getDate() + 1);
  });
  return sprints;
}

const sprintGoals = [
  'Deliver auth microservice v2', 'Complete dashboard redesign',
  'Ship payment gateway integration', 'Migrate to Kubernetes',
  'Launch search v3 with ML ranking', 'Complete SOC2 compliance audit',
  'Release mobile app 4.0', 'Deploy observability stack',
  'Deliver data pipeline v2', 'Ship notification service',
  'Complete API gateway migration', 'Launch self-service portal',
];

const storyTitles = [
  'Implement user authentication flow','Refactor database connection pooling',
  'Add real-time notification system','Optimize search query performance',
  'Build CI/CD pipeline for microservice','Create dashboard analytics widgets',
  'Implement caching layer for API','Design responsive navigation component',
  'Set up monitoring and alerting','Build data ingestion pipeline',
  'Automate regression test suite','Implement rate limiting middleware',
  'Add dark mode support','Optimize bundle size','Create API documentation',
  'Implement WebSocket connections','Build file upload service',
  'Add internationalization support','Create error tracking integration',
  'Implement feature flags system','Build user preference service',
  'Optimize database queries','Create data visualization components',
  'Implement OAuth2 integration','Build audit logging system',
  'Add performance monitoring','Create automated deployment scripts',
  'Implement data export functionality','Build notification preferences',
  'Add accessibility compliance','Implement search autocomplete',
  'Build metrics collection service','Create load testing framework',
  'Implement retry mechanism','Build health check endpoints',
  'Design API versioning strategy','Implement circuit breaker pattern',
  'Build distributed tracing','Create canary deployment pipeline',
  'Implement GraphQL gateway','Build event sourcing module',
];

const projectKeys = ['PLAT','FRONT','BACK','OPS','DATA','QA','SEC','MOB','ML','PAY','AUTH','OBS'];

// Generate issues
function generateIssues(employees, sprints) {
  const issues = [];
  let counter = 1;
  const rng = seededRandom(7777);

  employees.forEach((emp, empIdx) => {
    const pkIdx = empIdx % projectKeys.length;
    const projKey = projectKeys[pkIdx];

    sprints.forEach((sprint, sprintIdx) => {
      const issueCount = Math.floor(rng() * 4) + 3;
      for (let i = 0; i < issueCount; i++) {
        const type = issueTypes[Math.floor(rng() * issueTypes.length)];
        const storyPoints = type === 'Epic' ? Math.floor(rng() * 8 + 8) :
          type === 'Bug' ? Math.floor(rng() * 3 + 1) :
          type === 'Sub-task' ? Math.floor(rng() * 2 + 1) :
          Math.floor(rng() * 5 + 2);

        const completionRate = 0.55 + empIdx * 0.003 + sprintIdx * 0.02;
        const isCompleted = rng() < Math.min(completionRate, 0.92);
        const statusOpts = isCompleted ? ['Done'] :
          sprint.status === 'Active' ? ['In Progress','In Review','To Do'] :
          ['Done','In Progress','Blocked'];
        const status = statusOpts[Math.floor(rng() * statusOpts.length)];
        const titleIdx = Math.floor(rng() * storyTitles.length);
        const priority = priorities[Math.floor(rng() * priorities.length)];
        const estimatedHours = storyPoints * (1.5 + rng() * 1.5);
        const loggedHours = isCompleted ?
          estimatedHours * (0.7 + rng() * 0.6) :
          estimatedHours * (rng() * 0.5);

        const sprintStart = new Date(sprint.startDate);
        const sprintEnd = new Date(sprint.endDate);
        const createdDate = new Date(sprintStart.getTime() + rng() * (sprintEnd.getTime() - sprintStart.getTime()) * 0.3);
        const updatedDate = new Date(createdDate.getTime() + rng() * (sprintEnd.getTime() - createdDate.getTime()));

        issues.push({
          id: `${projKey}-${counter++}`,
          title: storyTitles[titleIdx],
          type, status, priority, storyPoints,
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
  const allLabels = ['performance','security','refactor','feature','tech-debt','documentation','ux','backend','frontend','infrastructure'];
  const count = Math.floor(rng() * 3);
  const labels = [];
  for (let i = 0; i < count; i++) {
    const label = allLabels[Math.floor(rng() * allLabels.length)];
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}

function generateActivityData(empId) {
  const rng = seededRandom(parseInt(empId.replace('EMP', '')) * 777);
  const activities = [];
  const startDate = new Date('2025-10-01');
  const endDate = new Date('2026-05-10');
  let current = new Date(startDate);
  while (current <= endDate) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
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

// OKR Data
function generateOKRs() {
  const objectives = [
    { id: 'OKR01', title: 'Improve Platform Reliability to 99.99%', dept: 'DEPT01', quarter: 'Q1 2026', progress: 78, keyResults: [
      { title: 'Reduce P1 incidents by 50%', progress: 85, metric: '12 → 6 incidents' },
      { title: 'Achieve 99.99% uptime SLA', progress: 72, metric: '99.97% current' },
      { title: 'Implement automated failover for all critical services', progress: 80, metric: '8/10 services' },
    ]},
    { id: 'OKR02', title: 'Accelerate Feature Delivery by 30%', dept: 'DEPT02', quarter: 'Q1 2026', progress: 65, keyResults: [
      { title: 'Reduce average cycle time to 3 days', progress: 60, metric: '4.2 days current' },
      { title: 'Increase sprint completion rate to 85%', progress: 70, metric: '78% current' },
      { title: 'Ship 15 customer-requested features', progress: 67, metric: '10/15 shipped' },
    ]},
    { id: 'OKR03', title: 'Achieve SOC2 Type II Certification', dept: 'DEPT06', quarter: 'Q1 2026', progress: 88, keyResults: [
      { title: 'Complete all control implementations', progress: 92, metric: '46/50 controls' },
      { title: 'Pass external audit with zero findings', progress: 85, metric: 'Audit in progress' },
      { title: 'Implement automated compliance monitoring', progress: 88, metric: '88% automated' },
    ]},
    { id: 'OKR04', title: 'Launch ML-Powered Search v3', dept: 'DEPT08', quarter: 'Q2 2026', progress: 42, keyResults: [
      { title: 'Improve search relevance by 40%', progress: 55, metric: '+22% so far' },
      { title: 'Reduce search latency to <100ms p99', progress: 35, metric: '180ms current' },
      { title: 'Deploy personalized ranking model', progress: 30, metric: 'In training' },
    ]},
    { id: 'OKR05', title: 'Scale Data Platform to 10x Throughput', dept: 'DEPT04', quarter: 'Q2 2026', progress: 55, keyResults: [
      { title: 'Migrate to Apache Kafka for streaming', progress: 70, metric: '7/10 pipelines' },
      { title: 'Implement data lakehouse architecture', progress: 45, metric: 'Phase 2/4' },
      { title: 'Reduce data processing costs by 25%', progress: 50, metric: '-12% so far' },
    ]},
  ];
  return objectives;
}

// Pre-generate data
const employees = generateEmployees();
const sprints = generateSprints();
const allIssues = generateIssues(employees, sprints);
const okrs = generateOKRs();
const teamNames = teams.map(t => t.name);

export { employees, teams, teamNames, departments, sprints, allIssues, okrs, issueTypes, issueStatuses, priorities, generateActivityData };

// Helper functions
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

// Team-level metrics
export function getTeamMetrics(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;
  const members = employees.filter(e => e.teamId === teamId);
  const teamIssues = allIssues.filter(i => members.some(m => m.id === i.assignee));
  const completed = teamIssues.filter(i => i.status === 'Done');
  const totalSP = teamIssues.reduce((s, i) => s + i.storyPoints, 0);
  const completedSP = completed.reduce((s, i) => s + i.storyPoints, 0);
  const blocked = teamIssues.filter(i => i.status === 'Blocked').length;

  return {
    team, members, memberCount: members.length,
    totalIssues: teamIssues.length,
    completedIssues: completed.length,
    completionRate: teamIssues.length > 0 ? Math.round((completed.length / teamIssues.length) * 100) : 0,
    totalSP, completedSP,
    avgVelocity: Math.round(completedSP / sprints.length),
    blockedIssues: blocked,
    healthScore: Math.min(100, Math.round((completed.length / Math.max(teamIssues.length, 1)) * 100 - blocked * 2)),
    sprintVelocities: sprints.map(s => {
      const si = teamIssues.filter(i => i.sprint === s.id && i.status === 'Done');
      return si.reduce((sum, i) => sum + i.storyPoints, 0);
    }),
  };
}

// Department-level metrics
export function getDeptMetrics(deptId) {
  const dept = departments.find(d => d.id === deptId);
  if (!dept) return null;
  const deptTeams = teams.filter(t => t.dept === deptId);
  const members = employees.filter(e => e.departmentId === deptId);
  const deptIssues = allIssues.filter(i => members.some(m => m.id === i.assignee));
  const completed = deptIssues.filter(i => i.status === 'Done');
  const totalSP = deptIssues.reduce((s, i) => s + i.storyPoints, 0);
  const completedSP = completed.reduce((s, i) => s + i.storyPoints, 0);

  return {
    dept, teams: deptTeams, memberCount: members.length,
    totalIssues: deptIssues.length,
    completedIssues: completed.length,
    completionRate: deptIssues.length > 0 ? Math.round((completed.length / deptIssues.length) * 100) : 0,
    totalSP, completedSP,
    avgVelocity: Math.round(completedSP / sprints.length),
    blockedIssues: deptIssues.filter(i => i.status === 'Blocked').length,
  };
}
