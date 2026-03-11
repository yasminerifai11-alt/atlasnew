"""
Atlas Command — NASA FIRMS Connector

Fire Information for Resource Management System
https://firms.modaps.eosdis.nasa.gov/
API docs: https://firms.modaps.eosdis.nasa.gov/api/

Schedule: every 6 hours
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.firms")

# FIRMS active fire data — CSV endpoint (VIIRS NOAA-20, last 24h)
# MAP_KEY is a free NASA FIRMS key obtainable at https://firms.modaps.eosdis.nasa.gov/api/area/
FIRMS_CSV_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/VIIRS_NOAA20_NRT/world/1"


class FIRMSConnector(BaseConnector):
    """Ingest active fire / thermal anomaly data from NASA FIRMS."""

    source_name = "NASA_FIRMS"
    dedup_time_window = timedelta(hours=12)
    dedup_distance_km = 10.0

    def __init__(self, session, firms_map_key: str = "") -> None:
        super().__init__(session)
        self.map_key = firms_map_key

    async def fetch(self) -> list[dict]:
        """Download the FIRMS CSV for the last 24 hours and parse it."""
        url = FIRMS_CSV_URL.format(map_key=self.map_key)
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        reader = csv.DictReader(io.StringIO(resp.text))
        records = []
        for row in reader:
            # Only keep high-confidence detections
            confidence = row.get("confidence", "")
            if confidence in ("low", "l"):
                continue
            records.append(dict(row))
        return records

    def normalize(self, raw: dict) -> dict | None:
        """Transform a FIRMS CSV row into Atlas event format."""
        try:
            lat = float(raw.get("latitude", 0))
            lon = float(raw.get("longitude", 0))
            frp = float(raw.get("frp", 0) or 0)  # Fire Radiative Power (MW)
            bright_ti4 = float(raw.get("bright_ti4", 0) or 0)
        except (ValueError, TypeError):
            return None

        # Parse acquisition datetime
        acq_date = raw.get("acq_date", "")
        acq_time = raw.get("acq_time", "0000")
        try:
            event_time = datetime.strptime(
                f"{acq_date} {acq_time}", "%Y-%m-%d %H%M"
            ).replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            event_time = datetime.now(timezone.utc)

        # Severity based on fire radiative power
        if frp >= 100:
            severity = RiskLevel.CRITICAL
            confidence_score = 90
        elif frp >= 30:
            severity = RiskLevel.HIGH
            confidence_score = 80
        elif frp >= 10:
            severity = RiskLevel.MEDIUM
            confidence_score = 70
        else:
            severity = RiskLevel.LOW
            confidence_score = 60

        # Override confidence from FIRMS data
        conf_raw = raw.get("confidence", "n")
        if conf_raw in ("high", "h"):
            confidence_score = min(confidence_score + 10, 100)

        country_id = raw.get("country_id", "XX")[:2]
        daynight = raw.get("daynight", "D")

        title = f"Thermal Anomaly ({frp:.0f} MW FRP)"
        description = (
            f"Active fire detected at {lat:.4f}, {lon:.4f} with "
            f"fire radiative power of {frp:.1f} MW. "
            f"Brightness temperature: {bright_ti4:.1f} K. "
            f"Detection: {'daytime' if daynight == 'D' else 'nighttime'}."
        )

        return {
            "title": title,
            "description": description,
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": _lat_lon_to_region(lat, lon),
            "country": country_id.upper(),
            "event_type": EventType.STRIKE,
            "sector": Sector.ENERGY,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"Satellite-detected thermal anomaly with {frp:.0f} MW radiative power. "
                "Could indicate wildfire, industrial fire, or infrastructure damage."
            ),
            "forecast_en": (
                "Monitor for spread or proximity to critical infrastructure. "
                "Check downstream air quality and transportation impacts."
            ),
            "actions_en": '{"Monitor fire progression","Assess infrastructure exposure","Check air quality impact"}',
        }


def _lat_lon_to_region(lat: float, lon: float) -> str:
    """Rough region assignment based on lat/lon quadrants."""
    if lat > 35 and -30 < lon < 60:
        return "Europe"
    if lat > 15 and 25 < lon < 75:
        return "Middle East"
    if lat > 0 and lon > 60:
        return "Asia-Pacific"
    if lat > 0 and lon < -30:
        return "Americas"
    if lat < 0 and lon > 20:
        return "Sub-Saharan Africa"
    if 0 < lat < 35 and -20 < lon < 40:
        return "North Africa"
    return "Global"
