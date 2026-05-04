"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Employee Schemas ──
class EmployeeOut(BaseModel):
    id: str
    display_name: str
    email: str
    avatar_url: str
    team: str
    role: str
    avatar_initials: str = ""

    class Config:
        from_attributes = True


class EmployeeMetrics(BaseModel):
    employee: EmployeeOut
    total_issues: int = 0
    completed_issues: int = 0
    completion_rate: float = 0
    total_story_points: float = 0
    completed_story_points: float = 0
    avg_velocity: float = 0
    total_logged_hours: float = 0
    total_estimated_hours: float = 0
    efficiency: float = 0
    bug_count: int = 0
    story_count: int = 0
    task_count: int = 0
    epic_count: int = 0
    blocked_issues: int = 0
    in_progress_issues: int = 0
    productivity_score: float = 0


# ── Sprint Schemas ──
class SprintOut(BaseModel):
    id: int
    name: str
    state: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class SprintMetrics(BaseModel):
    sprint: SprintOut
    total_issues: int = 0
    completed_issues: int = 0
    completion_rate: float = 0
    total_story_points: float = 0
    completed_story_points: float = 0


# ── Issue Schemas ──
class IssueOut(BaseModel):
    id: str
    key: str
    summary: str
    issue_type: str
    status: str
    priority: str
    story_points: float
    assignee_id: str
    sprint_name: str
    estimated_hours: float = 0
    logged_hours: float = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Analytics Schemas ──
class DashboardKPIs(BaseModel):
    total_employees: int
    total_issues: int
    completed_issues: int
    total_story_points: float
    completed_story_points: float
    avg_velocity: float
    completion_rate: float
    total_hours_logged: float
    sprint_labels: list[str] = []
    sprint_completed_sp: list[float] = []
    sprint_total_sp: list[float] = []
    sprint_estimated_hrs: list[float] = []
    sprint_logged_hrs: list[float] = []
    issue_type_breakdown: dict = {}
    priority_breakdown: dict = {}


class ProductivityScore(BaseModel):
    total: float
    completion: float
    velocity: float
    efficiency: float
    consistency: float


class LeaderboardEntry(BaseModel):
    employee: EmployeeOut
    score: ProductivityScore
    rank: int
    metrics: EmployeeMetrics


class ComparisonResult(BaseModel):
    employee_a: EmployeeMetrics
    employee_b: EmployeeMetrics
    score_a: ProductivityScore
    score_b: ProductivityScore
    sprint_labels: list[str] = []
    velocity_a: list[float] = []
    velocity_b: list[float] = []


class WorkloadEntry(BaseModel):
    employee: EmployeeOut
    active_issues: int
    remaining_sp: float
    completion_rate: float
    load_status: str  # overloaded, optimal, underloaded


class TimelineEvent(BaseModel):
    employee: EmployeeOut
    action: str
    issue_key: str
    issue_summary: str
    issue_type: str
    timestamp: Optional[datetime] = None


# ── Config Schemas ──
class JiraConfigIn(BaseModel):
    jira_base_url: str
    jira_email: str
    jira_api_token: str
    jira_project_keys: str


class HealthResponse(BaseModel):
    status: str
    jira_connected: bool
    last_sync: Optional[datetime] = None
    total_cached_issues: int = 0
    total_cached_employees: int = 0
    version: str
