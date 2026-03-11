"""
Atlas Command — GDACS Connector

Global Disaster Alerting Coordination System
https://www.gdacs.org/
RSS feed: https://www.gdacs.org/xml/rss.xml

Schedule: every 15 minutes
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

# Countries we care about for Middle East / Gulf filtering
ME_COUNTRIES = {
    "Kuwait", "Saudi Arabia", "United Arab Emirates", "Qatar", "Bahrain",
    "Oman", "Iraq", "Iran", "Yemen", "Egypt", "Jordan", "Syria", "Lebanon",
}

# Alert level → risk score + severity
_ALERT_RISK: dict[str, tuple[int, str]] = {
    "Red": (85, RiskLevel.CRITICAL),
    "Orange": (70, RiskLevel.HIGH),
    "Green": (40, RiskLevel.MEDIUM),
}

# GDACS event type mapping
_GDACS_TYPE_MAP: dict[str, str] = {
    "EQ": EventType.EARTHQUAKE,
    "TC": EventType.GEOPOLITICAL,
    "FL": EventType.GEOPOLITICAL,
    "VO": EventType.EARTHQUAKE,
    "DR": EventType.ECONOMIC,
    "WF": EventType.GEOPOLITICAL,
    "TS": EventType.EARTHQUAKE,
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
    """Ingest global disaster alerts from the GDACS RSS feed, filtered to Middle East."""

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
        """Transform a GDACS RSS item into Atlas event format, filtering to Middle East."""
        title = raw.get("title", "")
        if not title:
            return None

        # Filter: only Middle East / Gulf countries
        country_raw = raw.get("country", "") or ""
        if country_raw and country_raw not in ME_COUNTRIES:
            text_to_check = f"{title} {raw.get('description', '')} {country_raw}".lower()
            if not any(c.lower() in text_to_check for c in ME_COUNTRIES):
                return None

        # Parse coordinates
        try:
            lat = float(raw.get("lat", 0) or 0)
            lon = float(raw.get("lon", 0) or 0)
        except (ValueError, TypeError):
            lat, lon = 0.0, 0.0

        # Geographic filter: Middle East bounding box
        if lat != 0 and lon != 0:
            if not (12 <= lat <= 42 and 25 <= lon <= 65):
                return None

        # Parse date
        pub_date = raw.get("pubDate", "")
        event_time = _parse_rss_date(pub_date)

        alert_level = raw.get("alert_level", "Green")
        gdacs_type = raw.get("event_type", "")
        risk_score, severity = _ALERT_RISK.get(alert_level, (40, RiskLevel.MEDIUM))
        event_type = _GDACS_TYPE_MAP.get(gdacs_type, EventType.EARTHQUAKE)
        sector = _GDACS_SECTOR_MAP.get(gdacs_type, Sector.INFRASTRUCTURE)

        confidence_score = 90 if alert_level == "Red" else (80 if alert_level == "Orange" else 70)

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

        return {
            "title": title[:255],
            "description": description[:1000],
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": "Middle East",
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
    child = element.find(tag, ns) if ns else element.find(tag)
    return (child.text or "").strip() if child is not None else ""


def _parse_rss_date(date_str: str) -> datetime:
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
