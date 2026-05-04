"""
Jira REST API Client – async integration with Jira Cloud/Server.
Handles authentication, pagination, and data extraction.
"""
import httpx
import base64
import json
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config import settings
from app.database import Employee, Sprint, Issue, SyncLog

logger = logging.getLogger("jirapulse.jira")


class JiraClient:
    """Async client for Jira REST API v3."""

    def __init__(self):
        self.base_url = settings.jira_base_url.rstrip("/")
        self.auth = self._build_auth()

    def _build_auth(self) -> Optional[tuple]:
        if settings.jira_configured:
            return (settings.jira_email, settings.jira_api_token)
        return None

    @property
    def is_configured(self) -> bool:
        return settings.jira_configured

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        """Make authenticated request to Jira API."""
        url = f"{self.base_url}/rest/{path}"
        headers = {"Accept": "application/json", "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method, url, auth=self.auth, headers=headers, **kwargs
            )
            response.raise_for_status()
            return response.json() if response.text else {}

    async def test_connection(self) -> bool:
        """Test if Jira credentials are valid."""
        if not self.is_configured:
            return False
        try:
            await self._request("GET", "api/3/myself")
            return True
        except Exception as e:
            logger.error(f"Jira connection test failed: {e}")
            return False

    # ── Fetch Users ──
    async def fetch_project_members(self) -> list[dict]:
        """Fetch all assignable users for configured projects."""
        users = []
        seen_ids = set()
        for key in settings.project_keys:
            try:
                data = await self._request(
                    "GET",
                    f"api/3/user/assignable/search?project={key}&maxResults=200",
                )
                for user in data if isinstance(data, list) else []:
                    uid = user.get("accountId", "")
                    if uid and uid not in seen_ids and user.get("accountType") == "atlassian":
                        seen_ids.add(uid)
                        users.append({
                            "id": uid,
                            "display_name": user.get("displayName", ""),
                            "email": user.get("emailAddress", ""),
                            "avatar_url": user.get("avatarUrls", {}).get("48x48", ""),
                            "active": user.get("active", True),
                        })
            except Exception as e:
                logger.warning(f"Failed to fetch members for {key}: {e}")
        return users

    # ── Fetch Sprints ──
    async def fetch_sprints(self, board_id: int) -> list[dict]:
        """Fetch sprints for a board from the Agile API."""
        sprints = []
        start_at = 0
        while True:
            try:
                data = await self._request(
                    "GET",
                    f"agile/1.0/board/{board_id}/sprint?startAt={start_at}&maxResults=50",
                )
                values = data.get("values", [])
                for s in values:
                    sprints.append({
                        "id": s["id"],
                        "name": s.get("name", ""),
                        "state": s.get("state", ""),
                        "start_date": self._parse_date(s.get("startDate")),
                        "end_date": self._parse_date(s.get("endDate")),
                        "board_id": board_id,
                    })
                if data.get("isLast", True):
                    break
                start_at += len(values)
            except Exception as e:
                logger.warning(f"Failed to fetch sprints for board {board_id}: {e}")
                break
        return sprints

    async def fetch_boards(self) -> list[dict]:
        """Fetch all Scrum boards for configured projects."""
        boards = []
        for key in settings.project_keys:
            try:
                data = await self._request(
                    "GET",
                    f"agile/1.0/board?projectKeyOrId={key}&type=scrum&maxResults=50",
                )
                boards.extend(data.get("values", []))
            except Exception as e:
                logger.warning(f"Failed to fetch boards for {key}: {e}")
        return boards

    # ── Fetch Issues ──
    async def fetch_issues(self, project_key: str, start_at: int = 0) -> dict:
        """Fetch issues via JQL search with all relevant fields."""
        jql = f'project = "{project_key}" ORDER BY updated DESC'
        fields = (
            "summary,issuetype,status,priority,assignee,reporter,"
            "sprint,labels,story_points,customfield_10016,"  # story points field
            "timeestimate,timespent,created,updated,resolutiondate"
        )
        data = await self._request(
            "GET",
            f"api/3/search?jql={jql}&startAt={start_at}&maxResults=100&fields={fields}",
        )
        return data

    async def fetch_all_issues(self) -> list[dict]:
        """Fetch all issues across all configured projects with pagination."""
        all_issues = []
        for key in settings.project_keys:
            start_at = 0
            while True:
                try:
                    data = await self.fetch_issues(key, start_at)
                    issues = data.get("issues", [])
                    for raw in issues:
                        all_issues.append(self._parse_issue(raw, key))
                    total = data.get("total", 0)
                    start_at += len(issues)
                    if start_at >= total or not issues:
                        break
                except Exception as e:
                    logger.error(f"Failed to fetch issues for {key} at {start_at}: {e}")
                    break
            logger.info(f"Fetched {len(all_issues)} issues from {key}")
        return all_issues

    def _parse_issue(self, raw: dict, project_key: str) -> dict:
        """Parse raw Jira issue JSON into our schema."""
        fields = raw.get("fields", {})
        assignee = fields.get("assignee") or {}
        sprint = fields.get("sprint") or {}

        # Story points can be in different custom fields
        story_points = (
            fields.get("story_points")
            or fields.get("customfield_10016")
            or 0
        )

        return {
            "id": raw["id"],
            "key": raw["key"],
            "summary": fields.get("summary", ""),
            "issue_type": (fields.get("issuetype") or {}).get("name", ""),
            "status": (fields.get("status") or {}).get("name", ""),
            "priority": (fields.get("priority") or {}).get("name", ""),
            "story_points": float(story_points) if story_points else 0,
            "assignee_id": assignee.get("accountId", ""),
            "reporter_id": (fields.get("reporter") or {}).get("accountId", ""),
            "sprint_id": sprint.get("id"),
            "sprint_name": sprint.get("name", ""),
            "project_key": project_key,
            "labels": json.dumps(fields.get("labels", [])),
            "estimated_seconds": fields.get("timeestimate") or 0,
            "logged_seconds": fields.get("timespent") or 0,
            "created_at": self._parse_date(fields.get("created")),
            "updated_at": self._parse_date(fields.get("updated")),
            "resolved_at": self._parse_date(fields.get("resolutiondate")),
        }

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """Parse Jira date string to datetime."""
        if not date_str:
            return None
        try:
            # Jira uses ISO 8601 format
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

    # ── Full Sync ──
    async def sync_all(self, db: AsyncSession) -> dict:
        """Full sync: fetch all data from Jira and cache in SQLite."""
        log = SyncLog(started_at=datetime.utcnow())
        db.add(log)
        await db.commit()

        try:
            # Sync employees
            users = await self.fetch_project_members()
            for u in users:
                emp = await db.get(Employee, u["id"])
                if emp:
                    emp.display_name = u["display_name"]
                    emp.email = u["email"]
                    emp.avatar_url = u["avatar_url"]
                    emp.active = u["active"]
                    emp.last_synced = datetime.utcnow()
                else:
                    db.add(Employee(**u, last_synced=datetime.utcnow()))
            log.employees_synced = len(users)

            # Sync sprints
            boards = await self.fetch_boards()
            all_sprints = []
            for board in boards:
                sprints = await self.fetch_sprints(board["id"])
                all_sprints.extend(sprints)
            for s in all_sprints:
                existing = await db.get(Sprint, s["id"])
                if existing:
                    existing.name = s["name"]
                    existing.state = s["state"]
                    existing.start_date = s["start_date"]
                    existing.end_date = s["end_date"]
                    existing.last_synced = datetime.utcnow()
                else:
                    db.add(Sprint(**s, last_synced=datetime.utcnow()))
            log.sprints_synced = len(all_sprints)

            # Sync issues
            issues = await self.fetch_all_issues()
            for i in issues:
                existing = await db.get(Issue, i["id"])
                if existing:
                    for k, v in i.items():
                        setattr(existing, k, v)
                    existing.last_synced = datetime.utcnow()
                else:
                    db.add(Issue(**i, last_synced=datetime.utcnow()))
            log.issues_synced = len(issues)

            log.status = "completed"
            log.completed_at = datetime.utcnow()
            await db.commit()

            logger.info(
                f"Sync completed: {len(users)} users, {len(all_sprints)} sprints, {len(issues)} issues"
            )
            return {
                "status": "completed",
                "employees": len(users),
                "sprints": len(all_sprints),
                "issues": len(issues),
            }

        except Exception as e:
            log.status = "failed"
            log.error = str(e)
            log.completed_at = datetime.utcnow()
            await db.commit()
            logger.error(f"Sync failed: {e}")
            raise


# Singleton
jira_client = JiraClient()
