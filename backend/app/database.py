"""
SQLAlchemy async database setup with SQLite.
Caches Jira data locally for fast analytics queries.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean
from datetime import datetime
from app.config import settings


engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True)  # Jira account ID
    display_name = Column(String, nullable=False)
    email = Column(String, default="")
    avatar_url = Column(String, default="")
    team = Column(String, default="")
    role = Column(String, default="")
    active = Column(Boolean, default=True)
    last_synced = Column(DateTime, default=datetime.utcnow)


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    state = Column(String, default="")  # active, closed, future
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    board_id = Column(Integer, nullable=True)
    last_synced = Column(DateTime, default=datetime.utcnow)


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True)  # e.g., PROJ-123
    key = Column(String, nullable=False)
    summary = Column(Text, default="")
    issue_type = Column(String, default="")  # Story, Bug, Task, Epic, Sub-task
    status = Column(String, default="")  # To Do, In Progress, Done, etc.
    priority = Column(String, default="")
    story_points = Column(Float, default=0)
    assignee_id = Column(String, default="")
    reporter_id = Column(String, default="")
    sprint_id = Column(Integer, nullable=True)
    sprint_name = Column(String, default="")
    project_key = Column(String, default="")
    labels = Column(Text, default="")  # JSON array
    estimated_seconds = Column(Integer, default=0)
    logged_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    last_synced = Column(DateTime, default=datetime.utcnow)


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="running")  # running, completed, failed
    issues_synced = Column(Integer, default=0)
    employees_synced = Column(Integer, default=0)
    sprints_synced = Column(Integer, default=0)
    error = Column(Text, default="")


async def init_db():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency: yields an async DB session."""
    async with async_session() as session:
        yield session
