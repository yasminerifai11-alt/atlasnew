"""
Atlas Command — Base Ingestion Connector

Abstract base class that every data-source connector inherits from.
Provides the fetch → normalize → deduplicate → score → insert pipeline.
"""

from __future__ import annotations

import abc
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from services.risk_engine import compute_risk

logger = logging.getLogger("atlas.ingest")


class BaseConnector(abc.ABC):
    """
    Abstract base for all ingestion connectors.

    Subclasses MUST implement:
        source_name  — human-readable data source identifier
        fetch()      — pull raw records from the upstream API / feed
        normalize()  — convert one raw record into a dict matching the events table
    """

    source_name: str = "unknown"

    # Deduplication tunables (subclasses may override)
    dedup_time_window: timedelta = timedelta(hours=6)
    dedup_distance_km: float = 50.0
    dedup_title_similarity: float = 0.7  # threshold for pg_trgm similarity

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── Abstract interface ───────────────────────────────────────────

    @abc.abstractmethod
    async def fetch(self) -> list[dict]:
        """Return a list of raw records from the upstream source."""
        ...

    @abc.abstractmethod
    def normalize(self, raw: dict) -> dict | None:
        """
        Transform a single raw record into a dict with keys:

            title, description, event_time, latitude, longitude,
            region, country, event_type, sector, source, source_count,
            confidence_score, severity,
            situation_en, why_matters_en, forecast_en, actions_en
        """
        ...

    # ── Deduplication ────────────────────────────────────────────────

    async def deduplicate(self, normalized: dict) -> bool:
        """
        Return True if this event is a duplicate (should be skipped).

        Checks:
        1. Exact title + source match within time window
        2. Location proximity + time window for near-identical events
        """
        event_time = normalized["event_time"]
        lat = normalized["latitude"]
        lon = normalized["longitude"]
        title = normalized["title"]

        time_lo = event_time - self.dedup_time_window
        time_hi = event_time + self.dedup_time_window

        # Check 1: exact title + source within time window
        q1 = text("""
            SELECT COUNT(*) FROM events
            WHERE source = :source
              AND title = :title
              AND event_time BETWEEN :t_lo AND :t_hi
        """)
        result = await self.session.execute(q1, {
            "source": normalized["source"],
            "title": title,
            "t_lo": time_lo,
            "t_hi": time_hi,
        })
        if result.scalar() > 0:
            return True

        # Check 2: geographic proximity within time window
        # Haversine approximation using ST_DistanceSphere or degree math
        q2 = text("""
            SELECT COUNT(*) FROM events
            WHERE source = :source
              AND event_type = :event_type
              AND event_time BETWEEN :t_lo AND :t_hi
              AND (
                  6371 * acos(
                      LEAST(1.0, cos(radians(:lat)) * cos(radians(latitude))
                      * cos(radians(longitude) - radians(:lon))
                      + sin(radians(:lat)) * sin(radians(latitude)))
                  )
              ) < :dist_km
        """)
        result = await self.session.execute(q2, {
            "source": normalized["source"],
            "event_type": normalized["event_type"],
            "t_lo": time_lo,
            "t_hi": time_hi,
            "lat": lat,
            "lon": lon,
            "dist_km": self.dedup_distance_km,
        })
        if result.scalar() > 0:
            return True

        return False

    # ── Risk scoring ─────────────────────────────────────────────────

    @staticmethod
    def _score_event(normalized: dict) -> tuple[int, str]:
        """Compute risk_score and risk_level via the risk engine."""
        score, level = compute_risk(
            event_type=normalized["event_type"],
            severity=normalized["severity"],
            confidence_score=normalized["confidence_score"],
            source_count=normalized.get("source_count", 1),
        )
        return score, level.value

    # ── Persistence ──────────────────────────────────────────────────

    async def _insert_event(self, data: dict) -> int | None:
        """Insert a fully-scored event row and return its id."""
        now = datetime.now(timezone.utc)
        data.setdefault("source_count", 1)
        data.setdefault("financial_impact_en", None)
        data.setdefault("region_impact_en", None)
        data.setdefault("situation_ar", None)
        data.setdefault("why_matters_ar", None)
        data.setdefault("forecast_ar", None)
        data.setdefault("actions_ar", "{}")
        data.setdefault("financial_impact_ar", None)
        data.setdefault("region_impact_ar", None)

        query = text("""
            INSERT INTO events (
                title, description, event_time,
                latitude, longitude, region, country,
                event_type, sector, source, source_count,
                confidence_score, severity,
                risk_score, risk_level,
                situation_en, why_matters_en, forecast_en, actions_en,
                financial_impact_en, region_impact_en,
                situation_ar, why_matters_ar, forecast_ar, actions_ar,
                financial_impact_ar, region_impact_ar,
                created_at, updated_at
            ) VALUES (
                :title, :description, :event_time,
                :latitude, :longitude, :region, :country,
                :event_type, :sector, :source, :source_count,
                :confidence_score, :severity,
                :risk_score, :risk_level,
                :situation_en, :why_matters_en, :forecast_en, :actions_en,
                :financial_impact_en, :region_impact_en,
                :situation_ar, :why_matters_ar, :forecast_ar, :actions_ar,
                :financial_impact_ar, :region_impact_ar,
                :created_at, :updated_at
            )
            RETURNING id
        """)
        result = await self.session.execute(query, {
            **data,
            "created_at": now,
            "updated_at": now,
        })
        row = result.first()
        return row[0] if row else None

    # ── Main pipeline ────────────────────────────────────────────────

    async def run(self) -> int:
        """
        Execute the full ingest pipeline:
            fetch → normalize → deduplicate → score → insert

        Returns the number of newly inserted events.
        """
        inserted = 0
        connector_name = self.__class__.__name__

        try:
            raw_records = await self.fetch()
            logger.info("%s: fetched %d raw records", connector_name, len(raw_records))
        except Exception:
            logger.exception("%s: fetch failed", connector_name)
            return 0

        for raw in raw_records:
            try:
                normalized = self.normalize(raw)
                if normalized is None:
                    continue

                # Dedup check
                is_dup = await self.deduplicate(normalized)
                if is_dup:
                    continue

                # Risk scoring
                risk_score, risk_level = self._score_event(normalized)
                normalized["risk_score"] = risk_score
                normalized["risk_level"] = risk_level

                # Persist
                event_id = await self._insert_event(normalized)
                if event_id:
                    inserted += 1

            except Exception:
                logger.exception(
                    "%s: failed to process record: %s",
                    connector_name,
                    str(raw)[:200],
                )

        await self.session.commit()
        logger.info("%s: inserted %d new events", connector_name, inserted)
        return inserted
