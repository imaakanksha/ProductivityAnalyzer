"""
JiraPulse – FastAPI Application Entry Point.
Provides REST API for Jira productivity analytics with auto-generated Swagger docs.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, async_session
from app.routers.api import router
from app.seed import seed_demo_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("jirapulse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables and seed demo data if empty."""
    logger.info("Starting JiraPulse API...")
    await init_db()

    # Seed demo data if no Jira is configured and DB is empty
    if not settings.jira_configured:
        async with async_session() as db:
            from sqlalchemy import select, func
            from app.database import Issue
            count = await db.scalar(select(func.count(Issue.id)))
            if not count:
                logger.info("No Jira configured - seeding demo data...")
                await seed_demo_data(db)

    logger.info(f"JiraPulse API ready | Jira: {'Connected' if settings.jira_configured else 'Demo Mode'}")
    yield
    logger.info("Shutting down JiraPulse API")


app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="AI-powered Jira productivity analytics API. Analyze employee performance, sprint velocity, and team efficiency.",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(router)


@app.get("/")
async def root():
    return {
        "app": "JiraPulse API",
        "version": settings.app_version,
        "docs": "/docs",
        "mode": "live" if settings.jira_configured else "demo",
    }
