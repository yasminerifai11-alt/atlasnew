"""
Atlas Command — UKMTO Maritime Connector

United Kingdom Maritime Trade Operations
https://www.ukmto.org/
RSS feed for maritime security advisories

Schedule: RSS feed (polled every 15 minutes)
"""

from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
import re
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.ukmto")

# UKMTO provides advisories; the RSS feed URL
UKMTO_RSS_URL = "https://www.ukmto.org/indian-ocean/rss"

# Fallback: MDAT-GoG (Maritime Domain Awareness for Trade — Gulf of Guinea)
MDAT_GOG_RSS_URL = "https://www.ukmto.org/gulf-of-guinea/rss"


class UKMTOConnector(BaseConnector):
    """Ingest maritime security advisories from UKMTO RSS feeds."""

    source_name = "UKMTO"
    dedup_time_window = timedelta(hours=24)
    dedup_distance_km = 50.0

    async def fetch(self) -> list[dict]:
        """Fetch and parse UKMTO RSS feeds (Indian Ocean + Gulf of Guinea)."""
        all_items: list[dict] = []

        async with httpx.AsyncClient(timeout=20) as client:
            for feed_url, feed_region in [
                (UKMTO_RSS_URL, "Indian Ocean"),
                (MDAT_GOG_RSS_URL, "Gulf of Guinea"),
            ]:
                try:
                    resp = await client.get(feed_url)
                    resp.raise_for_status()
                    items = _parse_rss(resp.text, feed_region)
                    all_items.extend(items)
                except Exception:
                    logger.warning("UKMTO: failed to fetch %s feed", feed_region)

        return all_items

    def normalize(self, raw: dict) -> dict | None:
        """Transform a UKMTO RSS item into Atlas event format."""
        title = raw.get("title", "")
        if not title:
            return None

        description = raw.get("description", "") or ""
        pub_date = raw.get("pubDate", "")
        feed_region = raw.get("_feed_region", "Indian Ocean")

        event_time = _parse_rss_date(pub_date)

        # Extract coordinates from description if present
        lat, lon = _extract_coords(description)
        if lat is None:
            lat, lon = _extract_coords(title)
        if lat is None:
            # Default to approximate center of the region
            if "Gulf of Guinea" in feed_region:
                lat, lon = 3.0, 3.0
            else:
                lat, lon = 12.0, 50.0  # Gulf of Aden / Indian Ocean

        # Determine severity from keywords
        title_lower = title.lower()
        desc_lower = description.lower()
        combined = f"{title_lower} {desc_lower}"

        if any(w in combined for w in ("attack", "hijack", "firing", "piracy", "kidnap")):
            severity = RiskLevel.CRITICAL
            confidence_score = 85
        elif any(w in combined for w in ("suspicious", "approach", "boarding", "armed")):
            severity = RiskLevel.HIGH
            confidence_score = 80
        elif any(w in combined for w in ("warning", "advisory", "caution")):
            severity = RiskLevel.MEDIUM
            confidence_score = 75
        else:
            severity = RiskLevel.MEDIUM
            confidence_score = 70

        # Guess country from coordinates
        country = _coords_to_maritime_country(lat, lon)

        return {
            "title": f"UKMTO: {title[:230]}",
            "description": description[:1000],
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": feed_region,
            "country": country,
            "event_type": EventType.MARITIME,
            "sector": Sector.MARITIME,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description[:500] if description else title,
            "why_matters_en": (
                f"UKMTO has issued a maritime advisory in the {feed_region} region: {title}. "
                "Commercial shipping and offshore assets may be at risk."
            ),
            "forecast_en": (
                "Monitor for follow-up advisories and naval response. "
                "Review vessel routing through the affected area."
            ),
            "actions_en": '{"Alert maritime operations","Review vessel routing","Monitor naval response","Check insurance implications"}',
        }


# ─── Helpers ──────────────────────────────────────────────────────────

def _parse_rss(xml_text: str, feed_region: str) -> list[dict]:
    """Parse an RSS XML document into a list of item dicts."""
    items: list[dict] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        logger.warning("UKMTO: failed to parse RSS XML for %s", feed_region)
        return items

    for item in root.findall(".//item"):
        record: dict = {
            "_feed_region": feed_region,
        }
        for tag in ("title", "description", "pubDate", "link"):
            child = item.find(tag)
            record[tag] = (child.text or "").strip() if child is not None else ""
        items.append(record)

    return items


# Pattern for coordinates like "12°34'N 045°67'E" or "12.34N 45.67E" or decimal
_COORD_RE = re.compile(
    r"(\d{1,3})[°.](\d{1,2})?['\s]*([NS])\s*[,/\s]*"
    r"(\d{1,3})[°.](\d{1,2})?['\s]*([EW])",
    re.IGNORECASE,
)

_DECIMAL_RE = re.compile(
    r"(-?\d{1,3}\.\d+)\s*[,/\s]\s*(-?\d{1,3}\.\d+)"
)


def _extract_coords(text: str) -> tuple[float | None, float | None]:
    """Try to extract lat/lon from text."""
    m = _COORD_RE.search(text)
    if m:
        lat_d = float(m.group(1))
        lat_m = float(m.group(2) or 0)
        lat = lat_d + lat_m / 60.0
        if m.group(3).upper() == "S":
            lat = -lat

        lon_d = float(m.group(4))
        lon_m = float(m.group(5) or 0)
        lon = lon_d + lon_m / 60.0
        if m.group(6).upper() == "W":
            lon = -lon

        return lat, lon

    m = _DECIMAL_RE.search(text)
    if m:
        lat = float(m.group(1))
        lon = float(m.group(2))
        if -90 <= lat <= 90 and -180 <= lon <= 180:
            return lat, lon

    return None, None


def _parse_rss_date(date_str: str) -> datetime:
    """Parse RSS date formats."""
    formats = [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%d %b %Y %H:%M:%S",
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


def _coords_to_maritime_country(lat: float, lon: float) -> str:
    """Approximate country code for maritime coordinates."""
    # Gulf of Aden / Red Sea
    if 10 < lat < 16 and 42 < lon < 55:
        return "YE"
    # Strait of Hormuz
    if 24 < lat < 28 and 54 < lon < 58:
        return "OM"
    # Gulf of Guinea
    if -5 < lat < 10 and -10 < lon < 15:
        return "NG"
    # Strait of Malacca
    if -2 < lat < 8 and 98 < lon < 108:
        return "SG"
    # Somali Basin
    if -2 < lat < 12 and 40 < lon < 55:
        return "SO"
    return "XX"
