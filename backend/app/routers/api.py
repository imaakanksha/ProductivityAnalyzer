"""
API Routers – All REST endpoints for JiraPulse.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
import csv
import io

from app.database import get_db, Employee, Sprint, Issue, SyncLog
from app.jira_client import jira_client
from app.analytics import (
    get_all_employees, get_all_sprints, get_all_issues, get_employee_issues,
    make_employee_out, compute_employee_metrics, compute_productivity_score,
    compute_dashboard, compute_leaderboard, compute_comparison,
    compute_workload, compute_timeline,
)
from app import schemas

router = APIRouter(prefix="/api")


# ── Health ──
@router.get("/health", response_model=schemas.HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    issue_count = await db.scalar(select(func.count(Issue.id)))
    emp_count = await db.scalar(select(func.count(Employee.id)))
    last_sync_row = await db.execute(
        select(SyncLog).order_by(SyncLog.started_at.desc()).limit(1)
    )
    last_sync = last_sync_row.scalar_one_or_none()

    connected = jira_client.is_configured
    return schemas.HealthResponse(
        status="ok",
        jira_connected=connected,
        last_sync=last_sync.completed_at if last_sync else None,
        total_cached_issues=issue_count or 0,
        total_cached_employees=emp_count or 0,
        version="2.0.0",
    )


# ── Sync ──
@router.post("/sync")
async def sync_data(db: AsyncSession = Depends(get_db)):
    if not jira_client.is_configured:
        raise HTTPException(400, "Jira not configured. Set credentials via /api/config.")
    try:
        result = await jira_client.sync_all(db)
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(500, f"Sync failed: {str(e)}")


# ── Config ──
@router.post("/config")
async def update_config(config: schemas.JiraConfigIn):
    """Update Jira configuration (runtime only – for persistence, edit .env)."""
    from app.config import settings
    settings.jira_base_url = config.jira_base_url
    settings.jira_email = config.jira_email
    settings.jira_api_token = config.jira_api_token
    settings.jira_project_keys = config.jira_project_keys

    # Re-initialize client
    jira_client.__init__()
    connected = await jira_client.test_connection()
    return {"status": "configured", "jira_connected": connected}


# ── Employees ──
@router.get("/employees", response_model=list[schemas.EmployeeOut])
async def list_employees(db: AsyncSession = Depends(get_db)):
    employees = await get_all_employees(db)
    return [make_employee_out(e) for e in employees]


@router.get("/employees/{emp_id}")
async def get_employee_detail(emp_id: str, db: AsyncSession = Depends(get_db)):
    emp = await db.get(Employee, emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")
    issues = await get_employee_issues(db, emp_id)
    sprints = await get_all_sprints(db)
    all_issues = await get_all_issues(db)

    metrics = compute_employee_metrics(emp, issues, sprints)
    all_velocities = []
    employees = await get_all_employees(db)
    for e in employees:
        ei = [i for i in all_issues if i.assignee_id == e.id]
        m = compute_employee_metrics(e, ei, sprints)
        all_velocities.append(m.avg_velocity)

    score = compute_productivity_score(metrics, all_velocities)
    metrics.productivity_score = score.total

    # Per-sprint velocity for charts
    sprint_ids = [s.id for s in sprints[-8:]]
    sprint_labels = [s.name for s in sprints[-8:]]
    completed_sp = [sum(i.story_points or 0 for i in issues if i.sprint_id == sid and i.status and "done" in i.status.lower()) for sid in sprint_ids]
    total_sp = [sum(i.story_points or 0 for i in issues if i.sprint_id == sid) for sid in sprint_ids]

    return {
        "metrics": metrics,
        "score": score,
        "sprint_labels": sprint_labels,
        "sprint_completed_sp": completed_sp,
        "sprint_total_sp": total_sp,
        "recent_issues": [
            schemas.IssueOut(
                id=i.id, key=i.key, summary=i.summary, issue_type=i.issue_type,
                status=i.status, priority=i.priority, story_points=i.story_points,
                assignee_id=i.assignee_id, sprint_name=i.sprint_name,
                estimated_hours=round((i.estimated_seconds or 0) / 3600, 1),
                logged_hours=round((i.logged_seconds or 0) / 3600, 1),
                created_at=i.created_at, updated_at=i.updated_at,
            ) for i in issues[:50]
        ],
    }


# ── Sprints ──
@router.get("/sprints", response_model=list[schemas.SprintOut])
async def list_sprints(db: AsyncSession = Depends(get_db)):
    sprints = await get_all_sprints(db)
    return sprints


# ── Issues ──
@router.get("/issues")
async def list_issues(
    issue_type: str = Query(None),
    status: str = Query(None),
    assignee: str = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Issue).order_by(Issue.updated_at.desc())
    if issue_type:
        query = query.where(Issue.issue_type == issue_type)
    if status:
        query = query.where(Issue.status == status)
    if assignee:
        query = query.where(Issue.assignee_id == assignee)
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    issues = list(result.scalars().all())
    total = await db.scalar(select(func.count(Issue.id)))

    return {
        "issues": [
            schemas.IssueOut(
                id=i.id, key=i.key, summary=i.summary, issue_type=i.issue_type,
                status=i.status, priority=i.priority, story_points=i.story_points,
                assignee_id=i.assignee_id, sprint_name=i.sprint_name,
                estimated_hours=round((i.estimated_seconds or 0) / 3600, 1),
                logged_hours=round((i.logged_seconds or 0) / 3600, 1),
                created_at=i.created_at, updated_at=i.updated_at,
            ) for i in issues
        ],
        "total": total or 0,
        "offset": offset,
        "limit": limit,
    }


# ── Analytics ──
@router.get("/analytics/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    return await compute_dashboard(db)


@router.get("/analytics/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    return await compute_leaderboard(db)


@router.get("/analytics/comparison")
async def get_comparison(
    emp_a: str = Query(...), emp_b: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return await compute_comparison(db, emp_a, emp_b)


@router.get("/analytics/workload")
async def get_workload(db: AsyncSession = Depends(get_db)):
    return await compute_workload(db)


@router.get("/analytics/timeline")
async def get_timeline(limit: int = Query(30), db: AsyncSession = Depends(get_db)):
    return await compute_timeline(db, limit)


@router.get("/analytics/team")
async def get_team_overview(db: AsyncSession = Depends(get_db)):
    employees = await get_all_employees(db)
    all_issues = await get_all_issues(db)
    sprints = await get_all_sprints(db)

    teams = {}
    for emp in employees:
        team = emp.team or "Unassigned"
        if team not in teams:
            teams[team] = []
        ei = [i for i in all_issues if i.assignee_id == emp.id]
        m = compute_employee_metrics(emp, ei, sprints)
        teams[team].append({"employee": make_employee_out(emp), "metrics": m})

    return teams


# ── Export ──
@router.get("/export/{export_type}")
async def export_data(export_type: str, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import StreamingResponse

    if export_type == "employees":
        leaderboard = await compute_leaderboard(db)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Rank", "Name", "Team", "Role", "Score", "Completion%", "Velocity", "Story Points", "Hours Logged"])
        for entry in leaderboard:
            writer.writerow([
                entry.rank, entry.employee.display_name, entry.employee.team,
                entry.employee.role, entry.score.total, entry.metrics.completion_rate,
                entry.metrics.avg_velocity, entry.metrics.completed_story_points,
                entry.metrics.total_logged_hours,
            ])
        output.seek(0)
        return StreamingResponse(output, media_type="text/csv", headers={
            "Content-Disposition": f"attachment; filename=jirapulse_employees_{datetime.now().strftime('%Y%m%d')}.csv"
        })

    elif export_type == "issues":
        all_issues = await get_all_issues(db)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Key", "Summary", "Type", "Status", "Priority", "SP", "Assignee", "Sprint"])
        for i in all_issues:
            writer.writerow([i.key, i.summary, i.issue_type, i.status, i.priority, i.story_points, i.assignee_id, i.sprint_name])
        output.seek(0)
        return StreamingResponse(output, media_type="text/csv", headers={
            "Content-Disposition": f"attachment; filename=jirapulse_issues_{datetime.now().strftime('%Y%m%d')}.csv"
        })

    raise HTTPException(400, "Invalid export type. Use 'employees' or 'issues'.")
