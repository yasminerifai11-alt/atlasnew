"""
Atlas Command — GDELT Project Connector

Global Database of Events, Language, and Tone
https://www.gdeltproject.org/
API docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

Schedule: every 15 minutes
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.gdelt")

# GDELT 2.0 Events last-update file (15-min CSV export)
GDELT_LAST_UPDATE_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"

# GDELT DOC API for keyword-based monitoring
GDELT_DOC_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

# Event codes of interest (CAMEO codes)
# 19x = Use of force, 18x = Military, 14x = Protest, 20x = Unconventional mass violence
_CAMEO_INTEREST = {
    "190", "191", "192", "193", "194", "195",
    "180", "181", "182", "183",
    "140", "141", "142", "143", "144", "145",
    "200", "201", "202", "203",
}

# Map CAMEO root codes → Atlas event types
_CAMEO_TYPE_MAP: dict[str, str] = {
    "14": EventType.GEOPOLITICAL,  # Protest
    "17": EventType.GEOPOLITICAL,  # Coerce
    "18": EventType.STRIKE,        # Assault / Military
    "19": EventType.STRIKE,        # Use force
    "20": EventType.STRIKE,        # Unconventional mass violence
}


class GDELTConnector(BaseConnector):
    """Ingest high-impact geopolitical events from GDELT via the DOC 2.0 API."""

    source_name = "GDELT"
    dedup_time_window = timedelta(hours=6)
    dedup_distance_km = 50.0

    async def fetch(self) -> list[dict]:
        """
        Query the GDELT DOC API for recent high-impact security events.
        Returns article-level records with tone, themes, and locations.
        """
        queries = [
            "conflict attack military strike",
            "explosion bombing terror",
            "coup protest unrest",
            "maritime incident piracy",
            "cyberattack infrastructure",
        ]
        all_articles: list[dict] = []

        async with httpx.AsyncClient(timeout=30) as client:
            for q in queries:
                params = {
                    "query": q,
                    "mode": "ArtList",
                    "maxrecords": 75,
                    "timespan": "15min",
                    "format": "json",
                    "sort": "ToneDesc",
                }
                try:
                    resp = await client.get(GDELT_DOC_API_URL, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                    articles = data.get("articles", [])
                    for art in articles:
                        art["_query_theme"] = q
                    all_articles.extend(articles)
                except Exception:
                    logger.warning("GDELT: query '%s' failed", q)

        return all_articles

    def normalize(self, raw: dict) -> dict | None:
        """Transform a GDELT article record into Atlas event format."""
        title = raw.get("title", "")
        url = raw.get("url", "")
        source_domain = raw.get("domain", "")
        seendate = raw.get("seendate", "")
        language = raw.get("language", "English")
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

        # Determine severity from tone
        if tone_val < -10:
            severity = RiskLevel.CRITICAL
            confidence_score = 80
        elif tone_val < -5:
            severity = RiskLevel.HIGH
            confidence_score = 75
        elif tone_val < -2:
            severity = RiskLevel.MEDIUM
            confidence_score = 65
        else:
            severity = RiskLevel.LOW
            confidence_score = 55

        # Skip low-impact articles
        if tone_val > -2:
            return None

        # Extract location from socialimage or context if available
        lat = 0.0
        lon = 0.0
        country = "XX"
        region = "Global"

        # Try to use GDELT's geo fields if present
        if raw.get("sourcecountry"):
            country = raw["sourcecountry"][:2].upper()

        # Determine event type from query theme
        query_theme = raw.get("_query_theme", "")
        if "maritime" in query_theme or "piracy" in query_theme:
            event_type = EventType.MARITIME
            sector = Sector.MARITIME
        elif "cyber" in query_theme:
            event_type = EventType.CYBER
            sector = Sector.CYBER
        elif "conflict" in query_theme or "explosion" in query_theme:
            event_type = EventType.STRIKE
            sector = Sector.GEOPOLITICAL
        elif "coup" in query_theme or "protest" in query_theme:
            event_type = EventType.GEOPOLITICAL
            sector = Sector.GEOPOLITICAL
        else:
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
                f"GDELT media monitoring flagged this article with negative tone ({tone_val:.1f}). "
                f"Source: {source_domain}. Theme: {query_theme}."
            ),
            "forecast_en": (
                "Corroborate with additional sources. "
                "If confirmed, assess operational impact on regional assets."
            ),
            "actions_en": '{"Verify with secondary sources","Assess regional impact","Monitor for escalation"}',
        }
