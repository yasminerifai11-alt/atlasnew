"""
Atlas Command — AI Planetary Decision Intelligence
FastAPI Backend Entry Point

Run:
  uvicorn main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import engine
from routers import events, intelligence, alerts, brief, assets
from ingest.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger("atlas")


# ─── Lifespan ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — launch ingestion scheduler
    try:
        await start_scheduler()
        logger.info("Ingestion scheduler started")
    except Exception as e:
        logger.warning("Scheduler start skipped: %s", e)
    yield
    # Shutdown
    await stop_scheduler()
    await engine.dispose()


# ─── App ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="Atlas Command API",
    description=(
        "AI Planetary Decision Intelligence — Backend Service.\n\n"
        "Monitors global signals across conflict, energy, infrastructure, "
        "maritime, aviation, and cyber. Synthesizes into decision-grade intelligence."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ──────────────────────────────────────────────────────────

app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(brief.router, tags=["Briefs"])
app.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(assets.router, prefix="/assets", tags=["Assets"])


# ─── Health ──────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "operational",
        "service": "atlas-command-api",
        "version": "0.1.0",
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "Atlas Command API",
        "tagline": "AI Planetary Decision Intelligence",
        "version": "0.1.0",
        "docs": "/docs",
    }
