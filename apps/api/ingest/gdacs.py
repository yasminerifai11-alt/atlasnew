"""
Atlas Command — GDACS Connector

Global Disaster Alerting Coordination System
https://www.gdacs.org/
RSS feed: https://www.gdacs.org/xml/rss.xml

Schedule: real-time RSS (polled every 5 minutes)
"""

from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.gdacs")

GDACS_RSS_URL = "https://www.gdacs.org/xml/rss.xml"

# GDACS alert levels
_ALERT_SEVERITY: dict[str, str] = {
    "Red": RiskLevel.CRITICAL,
    "Orange": RiskLevel.HIGH,
    "Green": RiskLevel.MEDIUM,
}

# GDACS event type mapping
_GDACS_TYPE_MAP: dict[str, str] = {
    "EQ": EventType.EARTHQUAKE,
    "TC": EventType.STRIKE,       # Tropical Cyclone
    "FL": EventType.STRIKE,       # Flood
    "VO": EventType.EARTHQUAKE,   # Volcano
    "DR": EventType.ECONOMIC,     # Drought
    "WF": EventType.STRIKE,       # Wildfire
    "TS": EventType.EARTHQUAKE,   # Tsunami
}

_GDACS_SECTOR_MAP: dict[str, str] = {
    "EQ": Sector.INFRASTRUCTURE,
    "TC": Sector.INFRASTRUCTURE,
    "FL": Sector.INFRASTRUCTURE,
    "VO": Sector.INFRASTRUCTURE,
    "DR": Sector.ENERGY,
    "WF": Sector.ENERGY,
    "TS": Sector.MARITIME,
}

# XML namespaces used in the GDACS feed
NS = {
    "gdacs": "http://www.gdacs.org",
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
    "dc": "http://purl.org/dc/elements/1.1/",
}


class GDACSConnector(BaseConnector):
    """Ingest global disaster alerts from the GDACS RSS feed."""

    source_name = "GDACS"
    dedup_time_window = timedelta(hours=12)
    dedup_distance_km = 100.0

    async def fetch(self) -> list[dict]:
        """Fetch and parse the GDACS RSS XML feed."""
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(GDACS_RSS_URL)
            resp.raise_for_status()

        root = ET.fromstring(resp.text)
        items: list[dict] = []

        for item in root.findall(".//item"):
            record: dict = {}
            record["title"] = _text(item, "title")
            record["description"] = _text(item, "description")
            record["link"] = _text(item, "link")
            record["pubDate"] = _text(item, "pubDate")

            # GDACS-specific fields
            record["alert_level"] = _text(item, "gdacs:alertlevel", NS)
            record["event_type"] = _text(item, "gdacs:eventtype", NS)
            record["event_id"] = _text(item, "gdacs:eventid", NS)
            record["severity_text"] = _text(item, "gdacs:severity", NS)
            record["population"] = _text(item, "gdacs:population", NS)
            record["country"] = _text(item, "gdacs:country", NS)
            record["iso3"] = _text(item, "gdacs:iso3", NS)

            # Geo coordinates
            record["lat"] = _text(item, "geo:lat", NS)
            record["lon"] = _text(item, "geo:long", NS)

            items.append(record)

        return items

    def normalize(self, raw: dict) -> dict | None:
        """Transform a GDACS RSS item into Atlas event format."""
        title = raw.get("title", "")
        if not title:
            return None

        # Parse coordinates
        try:
            lat = float(raw.get("lat", 0) or 0)
            lon = float(raw.get("lon", 0) or 0)
        except (ValueError, TypeError):
            lat, lon = 0.0, 0.0

        # Parse date — format varies: "Mon, 11 Mar 2026 14:30:00 GMT"
        pub_date = raw.get("pubDate", "")
        event_time = _parse_rss_date(pub_date)

        alert_level = raw.get("alert_level", "Green")
        gdacs_type = raw.get("event_type", "")
        severity = _ALERT_SEVERITY.get(alert_level, RiskLevel.MEDIUM)
        event_type = _GDACS_TYPE_MAP.get(gdacs_type, EventType.EARTHQUAKE)
        sector = _GDACS_SECTOR_MAP.get(gdacs_type, Sector.INFRASTRUCTURE)

        confidence_score = 90 if alert_level == "Red" else (80 if alert_level == "Orange" else 70)

        country_raw = raw.get("country", "") or ""
        iso3 = raw.get("iso3", "")
        country_code = iso3[:2].upper() if iso3 else country_raw[:2].upper() if country_raw else "XX"

        severity_text = raw.get("severity_text", "")
        population = raw.get("population", "")
        description_raw = raw.get("description", "") or ""

        description = (
            f"GDACS {alert_level} alert: {title}. "
            f"{'Severity: ' + severity_text + '. ' if severity_text else ''}"
            f"{'Affected population: ' + population + '. ' if population else ''}"
            f"{description_raw[:300]}"
        )

        region = _country_to_region(country_raw)

        return {
            "title": title[:255],
            "description": description[:1000],
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": region,
            "country": country_code,
            "event_type": event_type,
            "sector": sector,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"GDACS has issued a {alert_level} alert for {title}. "
                f"{'Estimated affected population: ' + population + '. ' if population else ''}"
                "Assess impact on operations, infrastructure, and supply chains in the affected area."
            ),
            "forecast_en": (
                "Monitor GDACS for alert level changes. "
                "Review humanitarian and infrastructure damage reports as they become available."
            ),
            "actions_en": '{"Monitor alert status","Assess asset exposure","Review evacuation plans","Check supply chain impact"}',
        }


# ─── Helpers ──────────────────────────────────────────────────────────

def _text(element: ET.Element, tag: str, ns: dict | None = None) -> str:
    """Extract text from an XML element."""
    child = element.find(tag, ns) if ns else element.find(tag)
    return (child.text or "").strip() if child is not None else ""


def _parse_rss_date(date_str: str) -> datetime:
    """Parse common RSS date formats."""
    formats = [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            continue
    return datetime.now(timezone.utc)


_REGION_MAP: dict[str, str] = {
    "Afghanistan": "Middle East", "Iran": "Middle East", "Iraq": "Middle East",
    "Syria": "Middle East", "Yemen": "Middle East", "Saudi Arabia": "Middle East",
    "Turkey": "Middle East", "Lebanon": "Middle East", "Jordan": "Middle East",
    "Japan": "Asia-Pacific", "Philippines": "Asia-Pacific", "Indonesia": "Asia-Pacific",
    "China": "Asia-Pacific", "India": "Asia-Pacific", "Nepal": "Asia-Pacific",
    "Myanmar": "Asia-Pacific", "Bangladesh": "Asia-Pacific",
    "Italy": "Europe", "Greece": "Europe", "France": "Europe",
    "United States": "Americas", "Mexico": "Americas", "Haiti": "Americas",
    "Chile": "Americas", "Peru": "Americas", "Colombia": "Americas",
    "Somalia": "Sub-Saharan Africa", "Ethiopia": "Sub-Saharan Africa",
    "Kenya": "Sub-Saharan Africa", "Nigeria": "Sub-Saharan Africa",
    "Mozambique": "Sub-Saharan Africa", "Madagascar": "Sub-Saharan Africa",
}


def _country_to_region(country: str) -> str:
    return _REGION_MAP.get(country, "Global")
