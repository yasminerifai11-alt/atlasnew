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

ACLED_API_URL = "https://api.acleddata.com/acled/read"

GCC_COUNTRIES = {"Bahrain", "Kuwait", "Oman", "Qatar", "Saudi Arabia", "United Arab Emirates"}

# Map ACLED event types → Atlas EventType
_EVENT_TYPE_MAP: dict[str, str] = {
    "Explosions/Remote violence": EventType.STRIKE,
    "Battles": EventType.STRIKE,
    "Violence against civilians": EventType.STRIKE,
    "Protests": EventType.GEOPOLITICAL,
    "Riots": EventType.GEOPOLITICAL,
    "Strategic developments": EventType.GEOPOLITICAL,
}

# Base risk scores by mapped type
_BASE_RISK: dict[str, int] = {
    EventType.STRIKE: 60,
    EventType.GEOPOLITICAL: 30,
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
        """Fetch recent ACLED events from the last 7 days in the Middle East."""
        since = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
        params = {
            "key": self.api_key,
            "email": self.email,
            "region": 11,  # Middle East
            "limit": 50,
            "format": "json",
            "fields": "event_date|event_type|country|location|latitude|longitude|fatalities|notes|source",
            "event_date": since,
            "event_date_where": ">=",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(ACLED_API_URL, params=params)
            resp.raise_for_status()
            payload = resp.json()
        return payload.get("data", [])

    def _compute_risk_score(self, event_type: str, fatalities: int, country: str) -> int:
        """Risk score formula: base + fatality bonus + GCC bonus."""
        score = _BASE_RISK.get(event_type, 30)
        if fatalities > 10:
            score += 20
        elif fatalities > 0:
            score += 10
        if country in GCC_COUNTRIES:
            score += 10
        return min(score, 100)

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

        try:
            event_time = datetime.strptime(
                raw.get("event_date", ""), "%Y-%m-%d"
            ).replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            event_time = datetime.now(timezone.utc)

        fatalities = int(raw.get("fatalities", 0) or 0)
        country = raw.get("country", "")
        risk_score = self._compute_risk_score(event_type, fatalities, country)

        # Derive severity from risk score
        if risk_score >= 80:
            severity = RiskLevel.CRITICAL
        elif risk_score >= 60:
            severity = RiskLevel.HIGH
        elif risk_score >= 40:
            severity = RiskLevel.MEDIUM
        else:
            severity = RiskLevel.LOW

        location = raw.get("location", "")
        notes = raw.get("notes", "") or ""
        description = notes[:500] if notes else f"{acled_type} in {location}"

        # Deduplicate key: same date + lat + lon + event_type
        # (handled by BaseConnector.deduplicate via time window + distance + event_type)

        title = f"{acled_type}: {location}"
        country_code = country[:2].upper() if country else "XX"

        return {
            "title": title,
            "description": description,
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": "Middle East",
            "country": country_code,
            "event_type": event_type,
            "sector": Sector.GEOPOLITICAL,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": 85,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"Armed conflict event ({acled_type}) reported in {location}, "
                f"{country}. {fatalities} fatalities reported."
            ),
            "forecast_en": (
                "Ongoing instability likely; monitor for escalation "
                "and humanitarian impact in the region."
            ),
            "actions_en": '{"Monitor situation","Review regional exposure","Check asset proximity"}',
        }
