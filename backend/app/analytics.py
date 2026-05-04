"""
Productivity Analytics Engine – computes all metrics from cached Jira data.
Handles scoring, velocity, workload, comparisons, and timeline generation.
"""
import math
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.database import Employee, Sprint, Issue
from app import schemas


async def get_all_employees(db: AsyncSession) -> list[Employee]:
    result = await db.execute(select(Employee).where(Employee.active == True))
    return list(result.scalars().all())


async def get_all_sprints(db: AsyncSession) -> list[Sprint]:
    result = await db.execute(select(Sprint).order_by(Sprint.start_date))
    return list(result.scalars().all())


async def get_employee_issues(db: AsyncSession, emp_id: str) -> list[Issue]:
    result = await db.execute(
        select(Issue).where(Issue.assignee_id == emp_id).order_by(Issue.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_all_issues(db: AsyncSession) -> list[Issue]:
    result = await db.execute(select(Issue).order_by(Issue.updated_at.desc()))
    return list(result.scalars().all())


def make_employee_out(emp: Employee) -> schemas.EmployeeOut:
    initials = "".join(w[0].upper() for w in emp.display_name.split()[:2]) if emp.display_name else "?"
    return schemas.EmployeeOut(
        id=emp.id, display_name=emp.display_name, email=emp.email,
        avatar_url=emp.avatar_url, team=emp.team, role=emp.role,
        avatar_initials=initials,
    )


def compute_employee_metrics(emp: Employee, issues: list[Issue], sprints: list[Sprint]) -> schemas.EmployeeMetrics:
    """Compute all metrics for a single employee."""
    total = len(issues)
    done = [i for i in issues if i.status and "done" in i.status.lower()]
    completed = len(done)
    completion_rate = round((completed / total * 100) if total else 0, 1)

    total_sp = sum(i.story_points or 0 for i in issues)
    done_sp = sum(i.story_points or 0 for i in done)
    sprint_count = max(len(sprints), 1)
    avg_velocity = round(done_sp / sprint_count, 1)

    total_logged = sum((i.logged_seconds or 0) for i in issues) / 3600
    total_estimated = sum((i.estimated_seconds or 0) for i in issues) / 3600
    efficiency = round((total_estimated / max(total_logged, 1)) * 100, 1)

    return schemas.EmployeeMetrics(
        employee=make_employee_out(emp),
        total_issues=total,
        completed_issues=completed,
        completion_rate=completion_rate,
        total_story_points=total_sp,
        completed_story_points=done_sp,
        avg_velocity=avg_velocity,
        total_logged_hours=round(total_logged, 1),
        total_estimated_hours=round(total_estimated, 1),
        efficiency=efficiency,
        bug_count=len([i for i in issues if i.issue_type and "bug" in i.issue_type.lower()]),
        story_count=len([i for i in issues if i.issue_type and "story" in i.issue_type.lower()]),
        task_count=len([i for i in issues if i.issue_type and "task" in i.issue_type.lower()]),
        epic_count=len([i for i in issues if i.issue_type and "epic" in i.issue_type.lower()]),
        blocked_issues=len([i for i in issues if i.status and "block" in i.status.lower()]),
        in_progress_issues=len([i for i in issues if i.status and "progress" in i.status.lower()]),
        productivity_score=0,  # Filled later
    )


def compute_productivity_score(metrics: schemas.EmployeeMetrics, all_velocities: list[float]) -> schemas.ProductivityScore:
    """
    Weighted productivity score across 4 dimensions:
    - Completion Rate (35%): % of assigned issues marked Done
    - Velocity (25%): Normalized against team max
    - Efficiency (20%): Estimated vs logged time ratio
    - Consistency (20%): Stability of sprint-over-sprint performance
    """
    completion_score = min(metrics.completion_rate, 100)

    max_vel = max(all_velocities) if all_velocities else 1
    velocity_score = min((metrics.avg_velocity / max(max_vel, 1)) * 100, 100)

    efficiency_score = min(metrics.efficiency, 120) / 1.2

    # Simplified consistency (real version uses per-sprint data)
    consistency_score = max(100 - abs(metrics.efficiency - 100) * 0.5, 0)

    total = (
        completion_score * 0.35
        + velocity_score * 0.25
        + efficiency_score * 0.20
        + consistency_score * 0.20
    )

    return schemas.ProductivityScore(
        total=round(total, 1),
        completion=round(completion_score, 1),
        velocity=round(velocity_score, 1),
        efficiency=round(efficiency_score, 1),
        consistency=round(consistency_score, 1),
    )


# ── Dashboard ──
async def compute_dashboard(db: AsyncSession) -> schemas.DashboardKPIs:
    employees = await get_all_employees(db)
    all_issues = await get_all_issues(db)
    sprints = await get_all_sprints(db)

    done = [i for i in all_issues if i.status and "done" in i.status.lower()]
    total_sp = sum(i.story_points or 0 for i in all_issues)
    done_sp = sum(i.story_points or 0 for i in done)
    sprint_count = max(len(sprints), 1)

    # Per-sprint data
    sprint_labels = [s.name for s in sprints[-8:]]
    sprint_ids = [s.id for s in sprints[-8:]]

    sprint_completed_sp = []
    sprint_total_sp = []
    sprint_est = []
    sprint_log = []
    for sid in sprint_ids:
        s_issues = [i for i in all_issues if i.sprint_id == sid]
        s_done = [i for i in s_issues if i.status and "done" in i.status.lower()]
        sprint_completed_sp.append(sum(i.story_points or 0 for i in s_done))
        sprint_total_sp.append(sum(i.story_points or 0 for i in s_issues))
        sprint_est.append(round(sum((i.estimated_seconds or 0) for i in s_issues) / 3600, 1))
        sprint_log.append(round(sum((i.logged_seconds or 0) for i in s_issues) / 3600, 1))

    # Breakdowns
    type_counts = {}
    priority_counts = {}
    for i in all_issues:
        t = i.issue_type or "Other"
        p = i.priority or "None"
        type_counts[t] = type_counts.get(t, 0) + 1
        priority_counts[p] = priority_counts.get(p, 0) + 1

    return schemas.DashboardKPIs(
        total_employees=len(employees),
        total_issues=len(all_issues),
        completed_issues=len(done),
        total_story_points=total_sp,
        completed_story_points=done_sp,
        avg_velocity=round(done_sp / sprint_count, 1),
        completion_rate=round((len(done) / max(len(all_issues), 1)) * 100, 1),
        total_hours_logged=round(sum((i.logged_seconds or 0) for i in all_issues) / 3600, 1),
        sprint_labels=sprint_labels,
        sprint_completed_sp=sprint_completed_sp,
        sprint_total_sp=sprint_total_sp,
        sprint_estimated_hrs=sprint_est,
        sprint_logged_hrs=sprint_log,
        issue_type_breakdown=type_counts,
        priority_breakdown=priority_counts,
    )


# ── Leaderboard ──
async def compute_leaderboard(db: AsyncSession) -> list[schemas.LeaderboardEntry]:
    employees = await get_all_employees(db)
    sprints = await get_all_sprints(db)
    all_issues = await get_all_issues(db)

    entries = []
    all_velocities = []

    # First pass: compute metrics
    emp_metrics = {}
    for emp in employees:
        emp_issues = [i for i in all_issues if i.assignee_id == emp.id]
        m = compute_employee_metrics(emp, emp_issues, sprints)
        emp_metrics[emp.id] = m
        all_velocities.append(m.avg_velocity)

    # Second pass: compute scores
    for emp in employees:
        m = emp_metrics[emp.id]
        score = compute_productivity_score(m, all_velocities)
        m.productivity_score = score.total
        entries.append(schemas.LeaderboardEntry(
            employee=make_employee_out(emp), score=score, rank=0, metrics=m,
        ))

    # Sort and rank
    entries.sort(key=lambda e: e.score.total, reverse=True)
    for i, e in enumerate(entries):
        e.rank = i + 1

    return entries


# ── Comparison ──
async def compute_comparison(db: AsyncSession, emp_a_id: str, emp_b_id: str) -> schemas.ComparisonResult:
    sprints = await get_all_sprints(db)
    all_issues = await get_all_issues(db)
    emp_a = await db.get(Employee, emp_a_id)
    emp_b = await db.get(Employee, emp_b_id)

    issues_a = [i for i in all_issues if i.assignee_id == emp_a_id]
    issues_b = [i for i in all_issues if i.assignee_id == emp_b_id]

    m_a = compute_employee_metrics(emp_a, issues_a, sprints)
    m_b = compute_employee_metrics(emp_b, issues_b, sprints)

    all_vels = [m_a.avg_velocity, m_b.avg_velocity]
    score_a = compute_productivity_score(m_a, all_vels)
    score_b = compute_productivity_score(m_b, all_vels)

    # Per-sprint velocity
    sprint_ids = [s.id for s in sprints[-8:]]
    vel_a = [sum(i.story_points or 0 for i in issues_a if i.sprint_id == sid and i.status and "done" in i.status.lower()) for sid in sprint_ids]
    vel_b = [sum(i.story_points or 0 for i in issues_b if i.sprint_id == sid and i.status and "done" in i.status.lower()) for sid in sprint_ids]

    return schemas.ComparisonResult(
        employee_a=m_a, employee_b=m_b,
        score_a=score_a, score_b=score_b,
        sprint_labels=[s.name for s in sprints[-8:]],
        velocity_a=vel_a, velocity_b=vel_b,
    )


# ── Workload ──
async def compute_workload(db: AsyncSession) -> list[schemas.WorkloadEntry]:
    employees = await get_all_employees(db)
    all_issues = await get_all_issues(db)

    entries = []
    for emp in employees:
        emp_issues = [i for i in all_issues if i.assignee_id == emp.id]
        active = [i for i in emp_issues if i.status and ("progress" in i.status.lower() or "review" in i.status.lower())]
        active_count = len(active)
        remaining_sp = sum(i.story_points or 0 for i in emp_issues if not (i.status and "done" in i.status.lower()))
        done_count = len([i for i in emp_issues if i.status and "done" in i.status.lower()])
        comp_rate = round((done_count / max(len(emp_issues), 1)) * 100, 1)

        load = "overloaded" if active_count > 6 else "optimal" if active_count > 3 else "underloaded"

        entries.append(schemas.WorkloadEntry(
            employee=make_employee_out(emp),
            active_issues=active_count,
            remaining_sp=remaining_sp,
            completion_rate=comp_rate,
            load_status=load,
        ))
    return entries


# ── Timeline ──
async def compute_timeline(db: AsyncSession, limit: int = 30) -> list[schemas.TimelineEvent]:
    result = await db.execute(
        select(Issue).order_by(Issue.updated_at.desc()).limit(limit)
    )
    issues = list(result.scalars().all())

    employees = await get_all_employees(db)
    emp_map = {e.id: e for e in employees}

    events = []
    for issue in issues:
        emp = emp_map.get(issue.assignee_id)
        if not emp:
            continue

        status = (issue.status or "").lower()
        action = (
            "completed" if "done" in status
            else "moved to review" if "review" in status
            else "started" if "progress" in status
            else "updated"
        )

        events.append(schemas.TimelineEvent(
            employee=make_employee_out(emp),
            action=action,
            issue_key=issue.key,
            issue_summary=issue.summary,
            issue_type=issue.issue_type or "Task",
            timestamp=issue.updated_at,
        ))
    return events
