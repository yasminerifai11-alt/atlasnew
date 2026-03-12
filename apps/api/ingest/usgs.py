"""
Atlas Command — USGS Earthquake Hazards Connector

United States Geological Survey — FDSN Event Web Service
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

# FDSN event query endpoint (filtered to Middle East bbox)
USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"


class USGSConnector(BaseConnector):
    """Ingest earthquake data from the USGS FDSN event API."""

    source_name = "USGS"
    dedup_time_window = timedelta(hours=1)
    dedup_distance_km = 20.0

    async def fetch(self) -> list[dict]:
        """Fetch recent earthquakes (M3.5+) in the Middle East bounding box."""
        params = {
            "format": "geojson",
            "minmagnitude": 3.5,
            "orderby": "time",
            "limit": 20,
            "minlatitude": 12,
            "maxlatitude": 42,
            "minlongitude": 25,
            "maxlongitude": 65,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(USGS_API_URL, params=params)
            resp.raise_for_status()
            payload = resp.json()
        return payload.get("features", [])

    @staticmethod
    def _score_by_magnitude(mag: float) -> tuple[int, str]:
        """Risk score and level by magnitude bracket."""
        if mag >= 6.5:
            return 85, RiskLevel.CRITICAL
        if mag >= 5.5:
            return 70, RiskLevel.HIGH
        if mag >= 4.5:
            return 45, RiskLevel.MEDIUM
        # 3.5–4.5
        return 20, RiskLevel.LOW

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

        risk_score, severity = self._score_by_magnitude(mag)

        # Override severity if USGS alert level is elevated
        tsunami = bool(props.get("tsunami", 0))
        alert_level = props.get("alert", "")
        if alert_level == "red":
            severity = RiskLevel.CRITICAL
            risk_score = max(risk_score, 90)
        elif alert_level == "orange":
            severity = RiskLevel.HIGH
            risk_score = max(risk_score, 70)

        felt = props.get("felt") or 0

        title = f"M{mag:.1f} Earthquake — {place}"
        description = (
            f"Magnitude {mag:.1f} earthquake at depth {depth_km:.1f} km. "
            f"Location: {place}. "
            f"{'Tsunami warning issued. ' if tsunami else ''}"
            f"{'Felt by ' + str(felt) + ' people. ' if felt else ''}"
        )

        # Country from place string (USGS format: "X km TYPE of PLACE, COUNTRY")
        country = "XX"
        if ", " in place:
            country_name = place.rsplit(", ", 1)[-1].strip()
            country = _country_name_to_iso2(country_name)

        region = _usgs_region(lat, lon)

        confidence_score = 90 if mag >= 5.5 else 85 if mag >= 4.5 else 80

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
    if 12 <= lat <= 42 and 25 <= lon <= 65:
        return "Middle East"
    if lat > 35 and -30 < lon < 60:
        return "Europe"
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
    "Iran": "IR", "Iraq": "IQ", "Turkey": "TR", "Türkiye": "TR",
    "Afghanistan": "AF", "Pakistan": "PK", "Saudi Arabia": "SA",
    "Yemen": "YE", "Oman": "OM", "UAE": "AE",
    "United Arab Emirates": "AE", "Kuwait": "KW", "Bahrain": "BH",
    "Qatar": "QA", "Jordan": "JO", "Lebanon": "LB", "Syria": "SY",
    "Palestine": "PS", "Egypt": "EG", "Cyprus": "CY", "Greece": "GR",
    "India": "IN", "China": "CN", "Japan": "JP", "Indonesia": "ID",
    "Philippines": "PH", "Nepal": "NP", "Myanmar": "MM",
    "Tajikistan": "TJ", "Uzbekistan": "UZ", "Turkmenistan": "TM",
    "Azerbaijan": "AZ", "Georgia": "GE", "Armenia": "AM",
    "Russia": "RU", "Alaska": "US", "California": "US", "Hawaii": "US",
    "Mexico": "MX", "Chile": "CL", "Peru": "PE", "Colombia": "CO",
    "New Zealand": "NZ", "Italy": "IT", "Papua New Guinea": "PG",
    "Fiji": "FJ", "Tonga": "TO", "Vanuatu": "VU", "Solomon Islands": "SB",
    "Taiwan": "TW", "Ecuador": "EC", "Argentina": "AR", "Bolivia": "BO",
}


def _country_name_to_iso2(name: str) -> str:
    return _COUNTRY_ISO2.get(name, "XX")
