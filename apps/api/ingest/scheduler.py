"""
Atlas Command — Ingestion Scheduler

Uses APScheduler to register all connectors on their respective schedules.
After each new event saved, runs enrichment pipeline + infrastructure proximity.
Call start_scheduler() from the FastAPI lifespan to begin ingestion.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from core.config import settings
from core.database import async_session

logger = logging.getLogger("atlas.ingest.scheduler")

scheduler = AsyncIOScheduler(timezone="UTC")


# ─── Job wrapper with enrichment ─────────────────────────────────────

async def _run_connector(connector_cls, **kwargs) -> None:
    """Instantiate a connector with a fresh DB session, run it, then enrich new events."""
    from services.enrichment import enrich_and_save

    async with async_session() as session:
        connector = connector_cls(session, **kwargs)
        try:
            inserted = await connector.run()
            source_name = connector_cls.__name__
            ts = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
            logger.info("Scheduler: %s finished — %d new events at %s", source_name, inserted, ts)

            if inserted > 0:
                from sqlalchemy import text
                result = await session.execute(
                    text("""
                        SELECT id, title, description, event_type, country, region,
                               event_time, risk_score
                        FROM events
                        WHERE source = :source
                        ORDER BY created_at DESC
                        LIMIT :limit
                    """),
                    {"source": connector.source_name, "limit": inserted},
                )
                rows = result.fetchall()
                for row in rows:
                    event_data = {
                        "title": row[1],
                        "description": row[2],
                        "event_type": row[3],
                        "country": row[4],
                        "region": row[5],
                        "event_time": str(row[6]),
                        "risk_score": row[7],
                    }
                    try:
                        await enrich_and_save(session, row[0], event_data)
                    except Exception:
                        logger.exception("Enrichment failed for event %d", row[0])

                for row in rows:
                    try:
                        await _link_nearby_infra(session, row[0])
                    except Exception:
                        logger.exception("Infra linking failed for event %d", row[0])

        except Exception:
            logger.exception("Scheduler: %s failed", connector_cls.__name__)


async def _link_nearby_infra(session, event_id: int, radius_km: float = 25.0) -> int:
    """Find infrastructure within radius_km of event and create links."""
    from sqlalchemy import text

    query = text("""
        INSERT INTO event_infrastructure_links (event_id, infrastructure_id, distance_km, impact_type, impact_level)
        SELECT
            :event_id,
            i.id,
            (6371 * acos(
                LEAST(1.0, cos(radians(e.latitude)) * cos(radians(i.latitude))
                * cos(radians(i.longitude) - radians(e.longitude))
                + sin(radians(e.latitude)) * sin(radians(i.latitude)))
            )) AS dist_km,
            CASE
                WHEN (6371 * acos(LEAST(1.0, cos(radians(e.latitude)) * cos(radians(i.latitude))
                    * cos(radians(i.longitude) - radians(e.longitude))
                    + sin(radians(e.latitude)) * sin(radians(i.latitude))))) < 5 THEN 'DIRECT_THREAT'
                WHEN (6371 * acos(LEAST(1.0, cos(radians(e.latitude)) * cos(radians(i.latitude))
                    * cos(radians(i.longitude) - radians(e.longitude))
                    + sin(radians(e.latitude)) * sin(radians(i.latitude))))) < 15 THEN 'DISRUPTION_RISK'
                ELSE 'MONITORING'
            END,
            CASE
                WHEN (6371 * acos(LEAST(1.0, cos(radians(e.latitude)) * cos(radians(i.latitude))
                    * cos(radians(i.longitude) - radians(e.longitude))
                    + sin(radians(e.latitude)) * sin(radians(i.latitude))))) < 5 THEN 'CRITICAL'
                WHEN (6371 * acos(LEAST(1.0, cos(radians(e.latitude)) * cos(radians(i.latitude))
                    * cos(radians(i.longitude) - radians(e.longitude))
                    + sin(radians(e.latitude)) * sin(radians(i.latitude))))) < 15 THEN 'HIGH'
                ELSE 'MEDIUM'
            END
        FROM events e, infrastructure i
        WHERE e.id = :event_id
          AND (6371 * acos(
                LEAST(1.0, cos(radians(e.latitude)) * cos(radians(i.latitude))
                * cos(radians(i.longitude) - radians(e.longitude))
                + sin(radians(e.latitude)) * sin(radians(i.latitude)))
          )) < :radius
        ON CONFLICT DO NOTHING
    """)
    result = await session.execute(query, {"event_id": event_id, "radius": radius_km})
    await session.commit()
    count = result.rowcount or 0
    if count:
        logger.info("Linked %d infrastructure assets to event %d", count, event_id)
    return count


# ─── Registration ─────────────────────────────────────────────────────

def _register_jobs() -> None:
    """Register all ingestion connectors with their schedules."""

    from ingest.usgs import USGSConnector
    from ingest.gdelt import GDELTConnector
    from ingest.gdacs import GDACSConnector
    from ingest.firms import FIRMSConnector
    from ingest.eia import EIAConnector

    # USGS: every 5 minutes
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=5),
        args=[USGSConnector],
        id="usgs_earthquakes",
        name="USGS Earthquake Hazards",
        replace_existing=True,
    )

    # GDACS: every 15 minutes
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=15),
        args=[GDACSConnector],
        id="gdacs_disasters",
        name="GDACS Disaster Alerts",
        replace_existing=True,
    )

    # GDELT: every 30 minutes
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=30),
        args=[GDELTConnector],
        id="gdelt_events",
        name="GDELT Geopolitical Events",
        replace_existing=True,
    )

    # NASA FIRMS: every 30 minutes
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(minutes=30),
        args=[FIRMSConnector],
        kwargs={
            "firms_map_key": getattr(settings, "NASA_FIRMS_KEY", ""),
        },
        id="firms_fires",
        name="NASA FIRMS Active Fires",
        replace_existing=True,
    )

    # EIA: every 1 hour
    scheduler.add_job(
        _run_connector,
        trigger=IntervalTrigger(hours=1),
        args=[EIAConnector],
        kwargs={
            "eia_api_key": getattr(settings, "EIA_API_KEY", ""),
        },
        id="eia_energy",
        name="EIA Energy Data",
        replace_existing=True,
    )

    # ACLED: hourly (if keys configured)
    try:
        from ingest.acled import ACLEDConnector
        if settings.ACLED_API_KEY:
            scheduler.add_job(
                _run_connector,
                trigger=IntervalTrigger(hours=1),
                args=[ACLEDConnector],
                kwargs={
                    "acled_api_key": settings.ACLED_API_KEY,
                    "acled_email": settings.ACLED_EMAIL,
                },
                id="acled_conflict",
                name="ACLED Conflict Events",
                replace_existing=True,
            )
    except Exception:
        logger.warning("ACLED connector not available")

    logger.info("Scheduler: registered %d ingestion jobs", len(scheduler.get_jobs()))


# ─── Public API ───────────────────────────────────────────────────────

async def start_scheduler() -> None:
    """Start the APScheduler ingestion scheduler."""
    _register_jobs()
    scheduler.start()
    logger.info("Ingestion scheduler started")


async def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Ingestion scheduler stopped")
