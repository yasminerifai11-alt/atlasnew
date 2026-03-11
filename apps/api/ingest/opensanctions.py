"""
Atlas Command — OpenSanctions Connector

OpenSanctions — global sanctions & PEP data
https://www.opensanctions.org/
API docs: https://www.opensanctions.org/docs/api/

Schedule: daily
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.opensanctions")

# OpenSanctions public API — recent entity updates
OPENSANCTIONS_API_URL = "https://api.opensanctions.org/search/default"

# Watchlist keywords to monitor for new/updated sanctions
WATCHLIST_QUERIES = [
    "energy sanctions",
    "maritime sanctions",
    "oil embargo",
    "military sanctions",
    "cyber sanctions",
    "financial sanctions",
]


class OpenSanctionsConnector(BaseConnector):
    """Ingest new/updated sanctions entities from OpenSanctions."""

    source_name = "OpenSanctions"
    dedup_time_window = timedelta(days=3)
    dedup_distance_km = 5000.0  # entity-level, very wide dedup

    def __init__(self, session, opensanctions_api_key: str = "") -> None:
        super().__init__(session)
        self.api_key = opensanctions_api_key

    async def fetch(self) -> list[dict]:
        """
        Query the OpenSanctions search API for recently updated entities
        matching our watchlist keywords.
        """
        all_results: list[dict] = []

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"ApiKey {self.api_key}"

        async with httpx.AsyncClient(timeout=30) as client:
            for query in WATCHLIST_QUERIES:
                try:
                    params = {
                        "q": query,
                        "limit": 50,
                    }
                    resp = await client.get(
                        OPENSANCTIONS_API_URL,
                        params=params,
                        headers=headers,
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    results = data.get("results", [])
                    for r in results:
                        r["_query"] = query
                    all_results.extend(results)

                except Exception:
                    logger.warning("OpenSanctions: query '%s' failed", query)

        return all_results

    def normalize(self, raw: dict) -> dict | None:
        """Transform an OpenSanctions entity into Atlas event format."""
        entity_id = raw.get("id", "")
        name = raw.get("caption", "") or raw.get("name", "")
        schema_type = raw.get("schema", "")
        datasets = raw.get("datasets", [])
        properties = raw.get("properties", {})
        query = raw.get("_query", "")

        if not name:
            return None

        # Extract relevant properties
        countries = properties.get("country", [])
        country_code = countries[0][:2].upper() if countries else "XX"
        topics = properties.get("topics", [])
        notes = properties.get("notes", [])
        positions = properties.get("position", [])

        # Build description
        datasets_str = ", ".join(datasets[:5]) if datasets else "unknown"
        topics_str = ", ".join(topics[:5]) if topics else "general"
        notes_str = notes[0][:300] if notes else ""

        # Determine severity based on schema and datasets
        if any(d in datasets_str for d in ("us_ofac", "eu_sanctions", "un_sc")):
            severity = RiskLevel.HIGH
            confidence_score = 90
        elif any(d in datasets_str for d in ("gb_hmt", "au_dfat")):
            severity = RiskLevel.HIGH
            confidence_score = 85
        else:
            severity = RiskLevel.MEDIUM
            confidence_score = 75

        # Determine sector from query
        if "energy" in query or "oil" in query:
            sector = Sector.ENERGY
        elif "maritime" in query:
            sector = Sector.MARITIME
        elif "cyber" in query:
            sector = Sector.CYBER
        elif "financial" in query:
            sector = Sector.FINANCIAL
        elif "military" in query:
            sector = Sector.GEOPOLITICAL
        else:
            sector = Sector.GEOPOLITICAL

        title = f"Sanctions Entity: {name}"
        description = (
            f"Entity '{name}' ({schema_type}) found in sanctions datasets: {datasets_str}. "
            f"Topics: {topics_str}. "
            f"{notes_str}"
        )

        # Country → region mapping
        region = _country_to_region(country_code)

        # Approximate coordinates from country
        lat, lon = _country_centroid(country_code)

        return {
            "title": title[:255],
            "description": description[:1000],
            "event_time": datetime.now(timezone.utc),
            "latitude": lat,
            "longitude": lon,
            "region": region,
            "country": country_code,
            "event_type": EventType.GEOPOLITICAL,
            "sector": sector,
            "source": self.source_name,
            "source_count": len(datasets),
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description[:500],
            "why_matters_en": (
                f"Sanctions entity '{name}' appears across {len(datasets)} watchlists "
                f"({datasets_str}). Related to: {query}. "
                "Review compliance exposure and counterparty risk."
            ),
            "forecast_en": (
                "Monitor for additional designations or de-listings. "
                "Assess impact on ongoing contracts and financial relationships."
            ),
            "actions_en": '{"Screen counterparties","Review contract exposure","Update compliance records","Alert legal team"}',
        }


# ─── Helpers ──────────────────────────────────────────────────────────

_REGION_MAP: dict[str, str] = {
    "RU": "Europe", "IR": "Middle East", "KP": "Asia-Pacific",
    "SY": "Middle East", "CU": "Americas", "VE": "Americas",
    "CN": "Asia-Pacific", "BY": "Europe", "MM": "Asia-Pacific",
    "YE": "Middle East", "LY": "North Africa", "SD": "Sub-Saharan Africa",
    "SO": "Sub-Saharan Africa", "AF": "Middle East",
    "US": "Americas", "GB": "Europe", "FR": "Europe", "DE": "Europe",
}


def _country_to_region(code: str) -> str:
    return _REGION_MAP.get(code, "Global")


_CENTROIDS: dict[str, tuple[float, float]] = {
    "RU": (61.52, 105.32), "IR": (32.43, 53.69), "KP": (40.34, 127.51),
    "SY": (34.80, 38.99), "CU": (21.52, -77.78), "VE": (6.42, -66.59),
    "CN": (35.86, 104.20), "BY": (53.71, 27.95), "MM": (21.91, 95.96),
    "YE": (15.55, 48.52), "LY": (26.34, 17.23), "SD": (12.86, 30.22),
    "SO": (5.15, 46.20), "AF": (33.94, 67.71),
    "US": (39.83, -98.58), "GB": (55.38, -3.44),
}


def _country_centroid(code: str) -> tuple[float, float]:
    return _CENTROIDS.get(code, (0.0, 0.0))
