"""
Atlas Command — USGS Earthquake Hazards Connector

United States Geological Survey Earthquake Hazards Program
https://earthquake.usgs.gov/fdsnws/event/1/

Schedule: every 5 minutes
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.usgs")

# GeoJSON feed — significant earthquakes in the past hour
USGS_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"


class USGSConnector(BaseConnector):
    """Ingest earthquake data from the USGS GeoJSON feed."""

    source_name = "USGS"
    dedup_time_window = timedelta(hours=1)
    dedup_distance_km = 20.0

    async def fetch(self) -> list[dict]:
        """Fetch the USGS all-earthquakes-past-hour GeoJSON feed."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(USGS_FEED_URL)
            resp.raise_for_status()
            payload = resp.json()
        return payload.get("features", [])

    def normalize(self, raw: dict) -> dict | None:
        """Transform a USGS GeoJSON feature into Atlas event format."""
        props = raw.get("properties", {})
        geom = raw.get("geometry", {})
        coords = geom.get("coordinates", [0, 0, 0])

        if len(coords) < 2:
            return None

        lon, lat = float(coords[0]), float(coords[1])
        depth_km = float(coords[2]) if len(coords) > 2 else 0

        mag = float(props.get("mag", 0) or 0)
        place = props.get("place", "Unknown location")
        event_time_ms = props.get("time")

        if event_time_ms:
            event_time = datetime.fromtimestamp(event_time_ms / 1000, tz=timezone.utc)
        else:
            event_time = datetime.now(timezone.utc)

        # Severity by magnitude
        if mag >= 7.0:
            severity = RiskLevel.CRITICAL
            confidence_score = 95
        elif mag >= 5.5:
            severity = RiskLevel.HIGH
            confidence_score = 90
        elif mag >= 4.0:
            severity = RiskLevel.MEDIUM
            confidence_score = 85
        else:
            severity = RiskLevel.LOW
            confidence_score = 80

        # Skip very minor quakes (< 2.5) to reduce noise
        if mag < 2.5:
            return None

        tsunami = bool(props.get("tsunami", 0))
        felt = props.get("felt") or 0
        alert_level = props.get("alert", "")

        if alert_level == "red":
            severity = RiskLevel.CRITICAL
        elif alert_level == "orange":
            severity = RiskLevel.HIGH

        title = f"M{mag:.1f} Earthquake — {place}"
        description = (
            f"Magnitude {mag:.1f} earthquake at depth {depth_km:.1f} km. "
            f"Location: {place}. "
            f"{'Tsunami warning issued. ' if tsunami else ''}"
            f"{'Felt by ' + str(felt) + ' people. ' if felt else ''}"
        )

        # Attempt country from place string (USGS format: "X km TYPE of PLACE, COUNTRY")
        country = "XX"
        if ", " in place:
            country_name = place.rsplit(", ", 1)[-1].strip()
            country = _country_name_to_iso2(country_name)

        region = _usgs_region(lat, lon)

        return {
            "title": title,
            "description": description,
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": region,
            "country": country,
            "event_type": EventType.EARTHQUAKE,
            "sector": Sector.INFRASTRUCTURE,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"A magnitude {mag:.1f} earthquake struck {place} at {depth_km:.0f} km depth. "
                f"{'A tsunami advisory has been issued. ' if tsunami else ''}"
                "Assess impact on infrastructure, energy assets, and supply chains."
            ),
            "forecast_en": (
                "Aftershocks likely within 24-72 hours. "
                "Monitor for infrastructure damage reports and secondary hazards."
            ),
            "actions_en": '{"Monitor aftershock sequence","Assess infrastructure damage","Check tsunami advisories","Review supply chain impact"}',
        }


def _usgs_region(lat: float, lon: float) -> str:
    """Basic region classification from coordinates."""
    if lat > 35 and -30 < lon < 60:
        return "Europe"
    if lat > 15 and 25 < lon < 75:
        return "Middle East"
    if -10 < lat < 60 and lon > 60:
        return "Asia-Pacific"
    if lat > -55 and lon < -30:
        return "Americas"
    if lat < 0 and 20 < lon < 55:
        return "Sub-Saharan Africa"
    if 0 < lat < 35 and -20 < lon < 40:
        return "North Africa"
    return "Global"


# Minimal mapping for common USGS place suffixes
_COUNTRY_ISO2: dict[str, str] = {
    "Alaska": "US", "California": "US", "Hawaii": "US", "Oklahoma": "US",
    "Puerto Rico": "PR", "Japan": "JP", "Indonesia": "ID", "Chile": "CL",
    "Mexico": "MX", "Turkey": "TR", "Türkiye": "TR", "Iran": "IR",
    "Philippines": "PH", "New Zealand": "NZ", "Italy": "IT", "Greece": "GR",
    "Peru": "PE", "Colombia": "CO", "Afghanistan": "AF", "Pakistan": "PK",
    "China": "CN", "India": "IN", "Papua New Guinea": "PG", "Fiji": "FJ",
    "Tonga": "TO", "Vanuatu": "VU", "Solomon Islands": "SB", "Taiwan": "TW",
    "Ecuador": "EC", "Argentina": "AR", "Bolivia": "BO", "Russia": "RU",
    "Nepal": "NP", "Myanmar": "MM", "Tajikistan": "TJ",
}


def _country_name_to_iso2(name: str) -> str:
    return _COUNTRY_ISO2.get(name, "XX")
