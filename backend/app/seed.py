"""
Demo Data Seeder – populates SQLite with realistic mock Jira data
so the app works out-of-the-box without a Jira connection.
"""
import json
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import Employee, Sprint, Issue

TEAMS = ['Platform Engineering', 'Frontend Squad', 'Backend Services', 'DevOps & SRE', 'Data Engineering', 'QA Automation']
ROLES = ['Senior Software Engineer', 'Tech Lead', 'Full Stack Developer', 'DevOps Engineer', 'Data Engineer', 'QA Lead',
         'Software Engineer', 'Frontend Developer', 'Backend Developer', 'SRE Engineer', 'ML Engineer', 'Automation Engineer']
STATUSES = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked']
PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
TYPES = ['Story', 'Task', 'Bug', 'Sub-task', 'Epic']
PROJ_KEYS = ['PLAT', 'FRONT', 'BACK', 'OPS', 'DATA', 'QA']

PEOPLE = [
    ('Aarav Sharma', 'aarav.sharma@company.com'), ('Priya Patel', 'priya.patel@company.com'),
    ('Rahul Verma', 'rahul.verma@company.com'), ('Sneha Gupta', 'sneha.gupta@company.com'),
    ('Vikram Singh', 'vikram.singh@company.com'), ('Ananya Reddy', 'ananya.reddy@company.com'),
    ('Karthik Nair', 'karthik.nair@company.com'), ('Meera Joshi', 'meera.joshi@company.com'),
    ('Arjun Kumar', 'arjun.kumar@company.com'), ('Divya Iyer', 'divya.iyer@company.com'),
    ('Rohan Mehta', 'rohan.mehta@company.com'), ('Neha Kapoor', 'neha.kapoor@company.com'),
]

SUMMARIES = [
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
]

LABELS = ['performance', 'security', 'refactor', 'feature', 'tech-debt', 'documentation', 'ux', 'backend', 'frontend', 'infrastructure']


async def seed_demo_data(db: AsyncSession):
    """Seed realistic demo data into the database."""
    rng = random.Random(42)

    # ── Employees ──
    employees = []
    for i, (name, email) in enumerate(PEOPLE):
        emp = Employee(
            id=f"demo-{i+1:03d}",
            display_name=name,
            email=email,
            avatar_url="",
            team=TEAMS[i % len(TEAMS)],
            role=ROLES[i % len(ROLES)],
            active=True,
        )
        db.add(emp)
        employees.append(emp)

    # ── Sprints ──
    sprints = []
    start = datetime(2025, 10, 6)
    sprint_names = [
        'Sprint 2025-Q4-1', 'Sprint 2025-Q4-2', 'Sprint 2025-Q4-3',
        'Sprint 2026-Q1-1', 'Sprint 2026-Q1-2', 'Sprint 2026-Q1-3',
        'Sprint 2026-Q2-1', 'Sprint 2026-Q2-2',
    ]
    for idx, name in enumerate(sprint_names):
        end = start + timedelta(days=13)
        sp = Sprint(
            id=1000 + idx,
            name=name,
            state="active" if idx == len(sprint_names) - 1 else "closed",
            start_date=start,
            end_date=end,
            board_id=1,
        )
        db.add(sp)
        sprints.append(sp)
        start = end + timedelta(days=1)

    # ── Issues ──
    issue_id = 1
    for emp_idx, emp in enumerate(employees):
        pk = PROJ_KEYS[emp_idx % len(PROJ_KEYS)]
        for sp_idx, sprint in enumerate(sprints):
            count = rng.randint(4, 8)
            for _ in range(count):
                itype = rng.choice(TYPES)
                sp_val = {'Epic': rng.randint(8, 16), 'Bug': rng.randint(1, 3),
                          'Sub-task': rng.randint(1, 2)}.get(itype, rng.randint(2, 6))

                # Completion probability increases with sprint index
                comp_rate = 0.6 + emp_idx * 0.025 + sp_idx * 0.015
                is_done = rng.random() < min(comp_rate, 0.95)
                if is_done:
                    status = 'Done'
                elif sprint.state == 'active':
                    status = rng.choice(['In Progress', 'In Review', 'To Do'])
                else:
                    status = rng.choice(['Done', 'In Progress', 'Blocked'])

                est_hrs = sp_val * (1.5 + rng.random() * 1.5)
                log_hrs = est_hrs * (0.7 + rng.random() * 0.6) if is_done else est_hrs * rng.random() * 0.5

                created = sprint.start_date + timedelta(hours=rng.randint(0, 48))
                updated = created + timedelta(hours=rng.randint(1, 240))

                labels = json.dumps(rng.sample(LABELS, k=rng.randint(0, 3)))

                issue = Issue(
                    id=str(10000 + issue_id),
                    key=f"{pk}-{issue_id}",
                    summary=rng.choice(SUMMARIES),
                    issue_type=itype,
                    status=status,
                    priority=rng.choice(PRIORITIES),
                    story_points=sp_val,
                    assignee_id=emp.id,
                    reporter_id=rng.choice(employees).id,
                    sprint_id=sprint.id,
                    sprint_name=sprint.name,
                    project_key=pk,
                    labels=labels,
                    estimated_seconds=int(est_hrs * 3600),
                    logged_seconds=int(log_hrs * 3600),
                    created_at=created,
                    updated_at=updated,
                    resolved_at=updated if is_done else None,
                )
                db.add(issue)
                issue_id += 1

    await db.commit()
    print(f"[OK] Seeded: {len(employees)} employees, {len(sprints)} sprints, {issue_id - 1} issues")
