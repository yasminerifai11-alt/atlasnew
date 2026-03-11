"""
Atlas Command — Ingestion Scheduler

Uses APScheduler to register all connectors on their respective schedules.
Call start_scheduler() from the FastAPI lifespan to begin ingestion.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from core.config import settings
from core.database import async_session

logger = logging.getLogger("atlas.ingest.scheduler")

scheduler = AsyncIOScheduler(timezone="UTC")


# ─── Job wrapper ──────────────────────────────────────────────────────

async def _run_connector(connector_cls, **kwargs) -> None:
    """Instantiate a connector with a fresh DB session and run it."""
    async with async_session() as session:
        connector = connector_cls(session, **kwargs)
        try:
            inserted = await connector.run()
            logger.info("Scheduler: %s finished — %d new events", connector_cls.__name__, inserted)
        except Exception:
            logger.exception("Scheduler: %s failed", connector_cls.__name__)


# ─── Registration ─────────────────────────────────────────────────────

def _register_jobs() -> None:
    """Register all ingestion connectors with their schedules."""

    # Lazy imports to avoid circular / heavy import at module level
    from ingest.usgs import USGSConnector
    from ingest.opensky import OpenSkyConnector
    from ingest.gdelt import GDELTConnector
    from ingest.gdacs import GDACSConnector
    from ingest.ukmto import UKMTOConnector
    from ingest.acled import ACLEDConnector
    from ingest.firms import FIRMSConnector
    from ingest.eia import EIAConnector
    from ingest.opensanctions import OpenSanctionsConnector

    # ── Every 5 minutes ──────────────────────────────────────────
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=5),
        args=[USGSConnector],
        id="usgs_earthquakes",
        name="USGS Earthquake Hazards",
        replace_existing=True,
    )

    # ── Every 15 minutes ─────────────────────────────────────────
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=15),
        args=[OpenSkyConnector],
        kwargs={
            "opensky_user": getattr(settings, "OPENSKY_USER", ""),
            "opensky_pass": getattr(settings, "OPENSKY_PASS", ""),
        },
        id="opensky_aviation",
        name="OpenSky ADS-B Anomalies",
        replace_existing=True,
    )

    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=15),
        args=[GDELTConnector],
        id="gdelt_events",
        name="GDELT Geopolitical Events",
        replace_existing=True,
    )

    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=15),
        args=[UKMTOConnector],
        id="ukmto_maritime",
        name="UKMTO Maritime Advisories",
        replace_existing=True,
    )

    # ── Every 5 minutes (real-time RSS) ──────────────────────────
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=5),
        args=[GDACSConnector],
        id="gdacs_disasters",
        name="GDACS Disaster Alerts",
        replace_existing=True,
    )

    # ── Hourly ───────────────────────────────────────────────────
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(hours=1),
        args=[ACLEDConnector],
        kwargs={
            "acled_api_key": getattr(settings, "ACLED_API_KEY", ""),
            "acled_email": getattr(settings, "ACLED_EMAIL", ""),
        },
        id="acled_conflict",
        name="ACLED Conflict Events",
        replace_existing=True,
    )

    # ── Every 6 hours ────────────────────────────────────────────
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(hours=6),
        args=[FIRMSConnector],
        kwargs={
            "firms_map_key": getattr(settings, "FIRMS_MAP_KEY", ""),
        },
        id="firms_fires",
        name="NASA FIRMS Active Fires",
        replace_existing=True,
    )

    # ── Daily ────────────────────────────────────────────────────
    scheduler.add_job(
        _run_connector,
        trigger=CronTrigger(hour=6, minute=0),  # 06:00 UTC daily
        args=[EIAConnector],
        kwargs={
            "eia_api_key": getattr(settings, "EIA_API_KEY", ""),
        },
        id="eia_energy",
        name="EIA Energy Data",
        replace_existing=True,
    )

    scheduler.add_job(
        _run_connector,
        trigger=CronTrigger(hour=5, minute=0),  # 05:00 UTC daily
        args=[OpenSanctionsConnector],
        kwargs={
            "opensanctions_api_key": getattr(settings, "OPENSANCTIONS_API_KEY", ""),
        },
        id="opensanctions_entities",
        name="OpenSanctions Entity Data",
        replace_existing=True,
    )

    logger.info("Scheduler: registered %d ingestion jobs", len(scheduler.get_jobs()))


# ─── Public API ───────────────────────────────────────────────────────

async def start_scheduler() -> None:
    """Start the APScheduler ingestion scheduler. Call from FastAPI lifespan."""
    _register_jobs()
    scheduler.start()
    logger.info("Ingestion scheduler started")


async def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Ingestion scheduler stopped")
