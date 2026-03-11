"""
Atlas Command — ACLED Connector

Armed Conflict Location & Event Data Project
https://acleddata.com/
API docs: https://apidocs.acleddata.com/

Schedule: hourly
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.acled")

# Public read-only endpoint (requires free API key + email registered at acleddata.com)
ACLED_API_URL = "https://api.acleddata.com/acled/read"


# Map ACLED event types → Atlas EventType
_EVENT_TYPE_MAP: dict[str, str] = {
    "Battles": EventType.STRIKE,
    "Explosions/Remote violence": EventType.STRIKE,
    "Violence against civilians": EventType.STRIKE,
    "Protests": EventType.GEOPOLITICAL,
    "Riots": EventType.GEOPOLITICAL,
    "Strategic developments": EventType.GEOPOLITICAL,
}

_SEVERITY_MAP: dict[str, str] = {
    "Battles": RiskLevel.HIGH,
    "Explosions/Remote violence": RiskLevel.CRITICAL,
    "Violence against civilians": RiskLevel.HIGH,
    "Protests": RiskLevel.MEDIUM,
    "Riots": RiskLevel.HIGH,
    "Strategic developments": RiskLevel.MEDIUM,
}


class ACLEDConnector(BaseConnector):
    """Ingest conflict events from the ACLED API."""

    source_name = "ACLED"
    dedup_time_window = timedelta(hours=12)
    dedup_distance_km = 25.0

    def __init__(self, session, acled_api_key: str = "", acled_email: str = "") -> None:
        super().__init__(session)
        self.api_key = acled_api_key
        self.email = acled_email

    async def fetch(self) -> list[dict]:
        """Fetch recent ACLED events from the last 24 hours."""
        since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime("%Y-%m-%d")
        params = {
            "key": self.api_key,
            "email": self.email,
            "event_date": since,
            "event_date_where": ">=",
            "limit": 500,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(ACLED_API_URL, params=params)
            resp.raise_for_status()
            payload = resp.json()
        return payload.get("data", [])

    def normalize(self, raw: dict) -> dict | None:
        """Transform an ACLED record into Atlas event format."""
        try:
            lat = float(raw.get("latitude", 0))
            lon = float(raw.get("longitude", 0))
        except (ValueError, TypeError):
            return None

        acled_type = raw.get("event_type", "")
        event_type = _EVENT_TYPE_MAP.get(acled_type, EventType.GEOPOLITICAL)
        severity = _SEVERITY_MAP.get(acled_type, RiskLevel.MEDIUM)

        # Parse date — ACLED returns "YYYY-MM-DD"
        try:
            event_time = datetime.strptime(
                raw.get("event_date", ""), "%Y-%m-%d"
            ).replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            event_time = datetime.now(timezone.utc)

        fatalities = int(raw.get("fatalities", 0) or 0)
        if fatalities >= 10:
            severity = RiskLevel.CRITICAL
        elif fatalities >= 3:
            severity = RiskLevel.HIGH

        title = raw.get("event_type", "Conflict Event")
        location = raw.get("location", "")
        country = raw.get("iso3", "")[:2] if raw.get("iso3") else raw.get("country", "")[:2]
        region = raw.get("region", "Unknown")

        notes = raw.get("notes", "") or ""
        description = notes[:500] if notes else f"{acled_type} in {location}"

        return {
            "title": f"{title}: {location}",
            "description": description,
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": region,
            "country": country.upper()[:2],
            "event_type": event_type,
            "sector": Sector.GEOPOLITICAL,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": 85,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"Armed conflict event ({acled_type}) reported in {location}, "
                f"{raw.get('country', 'unknown')}. {fatalities} fatalities reported."
            ),
            "forecast_en": (
                "Ongoing instability likely; monitor for escalation "
                "and humanitarian impact in the region."
            ),
            "actions_en": f'{{"Monitor situation","Review regional exposure","Check asset proximity"}}',
        }
