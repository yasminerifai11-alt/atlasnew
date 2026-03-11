"""
Atlas Command — GDELT Project Connector

Global Database of Events, Language, and Tone
https://www.gdeltproject.org/
API docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

Schedule: every 30 minutes
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.gdelt")

GDELT_DOC_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc"


class GDELTConnector(BaseConnector):
    """Ingest high-impact geopolitical events from GDELT via the DOC 2.0 API."""

    source_name = "GDELT"
    dedup_time_window = timedelta(hours=6)
    dedup_distance_km = 50.0

    async def fetch(self) -> list[dict]:
        """
        Query the GDELT DOC API for recent Middle East / Gulf conflict news.
        """
        params = {
            "query": "Middle East OR Gulf OR Iran OR Iraq OR Yemen conflict attack",
            "mode": "artlist",
            "maxrecords": 25,
            "format": "json",
            "timespan": "6h",
        }

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(GDELT_DOC_API_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                return data.get("articles", [])
            except Exception:
                logger.warning("GDELT: fetch failed")
                return []

    def normalize(self, raw: dict) -> dict | None:
        """Transform a GDELT article record into Atlas event format."""
        title = raw.get("title", "")
        url = raw.get("url", "")
        source_domain = raw.get("domain", "")
        seendate = raw.get("seendate", "")
        tone = raw.get("tone", 0)

        if not title:
            return None

        # Parse seen date — format "20260311T143000Z"
        try:
            event_time = datetime.strptime(seendate, "%Y%m%dT%H%M%SZ").replace(
                tzinfo=timezone.utc
            )
        except (ValueError, TypeError):
            event_time = datetime.now(timezone.utc)

        # Tone is negative for negative events (range roughly -25 to +25)
        tone_val = float(tone) if tone else 0

        # Risk score and severity based on tone
        if tone_val < -5:
            risk_score = 65
            severity = RiskLevel.HIGH
            confidence_score = 75
        elif tone_val < -2:
            risk_score = 40
            severity = RiskLevel.MEDIUM
            confidence_score = 65
        else:
            risk_score = 20
            severity = RiskLevel.LOW
            confidence_score = 55

        # Extract location from socialimage or context if available
        lat = 0.0
        lon = 0.0
        country = "XX"
        region = "Middle East"

        # Try to use GDELT's geo fields if present
        if raw.get("sourcecountry"):
            country = raw["sourcecountry"][:2].upper()

        event_type = EventType.GEOPOLITICAL
        sector = Sector.GEOPOLITICAL

        description = (
            f"GDELT detected article: \"{title}\" "
            f"(source: {source_domain}, tone: {tone_val:.1f}). "
            f"Original URL: {url}"
        )

        return {
            "title": title[:255],
            "description": description[:1000],
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": region,
            "country": country,
            "event_type": event_type,
            "sector": sector,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": f"Media report: {title}",
            "why_matters_en": (
                f"GDELT media monitoring flagged this article with tone ({tone_val:.1f}). "
                f"Source: {source_domain}."
            ),
            "forecast_en": (
                "Corroborate with additional sources. "
                "If confirmed, assess operational impact on regional assets."
            ),
            "actions_en": '{"Verify with secondary sources","Assess regional impact","Monitor for escalation"}',
        }
