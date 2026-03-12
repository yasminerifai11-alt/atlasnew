"""
Atlas Command — OpenSky Network Connector

ADS-B flight tracking data from the OpenSky Network
https://opensky-network.org/
API docs: https://openskynetwork.github.io/opensky-api/rest.html

Schedule: every 15 minutes

NOTE: The OpenSky connector focuses on anomaly detection — flights
in restricted airspace, unusual altitude / speed, or military transponders
near conflict zones. It does NOT ingest all flights.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.opensky")

# OpenSky REST API — all state vectors
OPENSKY_API_URL = "https://opensky-network.org/api/states/all"

# Regions of interest for anomaly detection (lat_min, lat_max, lon_min, lon_max)
MONITORED_BBOXES: dict[str, tuple[float, float, float, float]] = {
    "Middle East":     (12.0, 42.0, 25.0, 65.0),
    "Eastern Europe":  (44.0, 56.0, 22.0, 42.0),
    "East Asia":       (20.0, 45.0, 100.0, 145.0),
    "Horn of Africa":  (-2.0, 18.0, 32.0, 55.0),
}


class OpenSkyConnector(BaseConnector):
    """
    Ingest aviation anomalies from the OpenSky Network.

    Detects: flights at unusual altitudes, military transponder callsigns
    in conflict areas, and aircraft in restricted flight zones.
    """

    source_name = "OpenSky"
    dedup_time_window = timedelta(minutes=30)
    dedup_distance_km = 50.0

    def __init__(self, session, opensky_user: str = "", opensky_pass: str = "") -> None:
        super().__init__(session)
        self.auth = (opensky_user, opensky_pass) if opensky_user else None

    async def fetch(self) -> list[dict]:
        """
        Fetch state vectors from monitored bounding boxes.
        Returns anomalous flights only.
        """
        anomalies: list[dict] = []

        async with httpx.AsyncClient(timeout=30) as client:
            for region_name, bbox in MONITORED_BBOXES.items():
                lat_min, lat_max, lon_min, lon_max = bbox
                params = {
                    "lamin": lat_min,
                    "lamax": lat_max,
                    "lomin": lon_min,
                    "lomax": lon_max,
                }
                try:
                    if self.auth:
                        resp = await client.get(OPENSKY_API_URL, params=params, auth=self.auth)
                    else:
                        resp = await client.get(OPENSKY_API_URL, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                except Exception:
                    logger.warning("OpenSky: failed to fetch %s bbox", region_name)
                    continue

                states = data.get("states") or []
                for sv in states:
                    record = _parse_state_vector(sv, region_name)
                    if record and _is_anomalous(record):
                        anomalies.append(record)

        return anomalies

    def normalize(self, raw: dict) -> dict | None:
        """Transform an anomalous OpenSky state vector into Atlas event format."""
        callsign = raw.get("callsign", "UNKNOWN").strip()
        lat = raw.get("latitude")
        lon = raw.get("longitude")
        region = raw.get("region", "Global")

        if lat is None or lon is None:
            return None

        altitude_m = raw.get("baro_altitude") or raw.get("geo_altitude") or 0
        velocity_ms = raw.get("velocity") or 0
        origin_country = raw.get("origin_country", "XX")
        on_ground = raw.get("on_ground", False)

        anomaly_type = raw.get("anomaly_type", "unusual_activity")

        # Determine severity
        if anomaly_type == "military_callsign":
            severity = RiskLevel.HIGH
            confidence_score = 70
        elif anomaly_type == "low_altitude":
            severity = RiskLevel.MEDIUM
            confidence_score = 65
        else:
            severity = RiskLevel.MEDIUM
            confidence_score = 60

        title = f"Aviation Anomaly: {callsign} over {region}"
        description = (
            f"Callsign {callsign} (origin: {origin_country}) detected at "
            f"altitude {altitude_m:.0f}m, speed {velocity_ms:.0f} m/s. "
            f"Anomaly type: {anomaly_type.replace('_', ' ')}."
        )

        country_iso = _country_to_iso2(origin_country)

        return {
            "title": title,
            "description": description,
            "event_time": datetime.now(timezone.utc),
            "latitude": lat,
            "longitude": lon,
            "region": region,
            "country": country_iso,
            "event_type": EventType.AVIATION,
            "sector": Sector.AVIATION,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"Aircraft {callsign} exhibiting anomalous behavior in {region}. "
                f"Anomaly: {anomaly_type.replace('_', ' ')}. "
                "May indicate military activity, surveillance, or airspace violation."
            ),
            "forecast_en": (
                "Monitor for corroborating signals from ADS-B, radar, "
                "and regional NOTAMs. Track airspace closure updates."
            ),
            "actions_en": '{"Track aircraft trajectory","Check regional NOTAMs","Cross-reference with conflict data"}',
        }


# ─── Helpers ──────────────────────────────────────────────────────────

def _parse_state_vector(sv: list, region_name: str) -> dict | None:
    """Parse an OpenSky state vector array into a dict."""
    if not sv or len(sv) < 17:
        return None
    return {
        "icao24": sv[0],
        "callsign": (sv[1] or "").strip(),
        "origin_country": sv[2] or "",
        "time_position": sv[3],
        "last_contact": sv[4],
        "longitude": sv[5],
        "latitude": sv[6],
        "baro_altitude": sv[7],
        "on_ground": sv[8],
        "velocity": sv[9],
        "true_track": sv[10],
        "vertical_rate": sv[11],
        "sensors": sv[12],
        "geo_altitude": sv[13],
        "squawk": sv[14],
        "spi": sv[15],
        "position_source": sv[16],
        "region": region_name,
    }


# Military callsign prefixes (common patterns)
_MILITARY_PREFIXES = (
    "RFF", "RSD", "FORTE", "DUKE", "JAKE", "HOMER", "LAGR",
    "NATO", "RKAF", "IAF", "UAVGH", "REAP", "VIPER", "HAWK",
)


def _is_anomalous(record: dict) -> bool:
    """Determine if a flight state vector represents an anomaly worth tracking."""
    callsign = record.get("callsign", "").upper()
    on_ground = record.get("on_ground", True)
    altitude = record.get("baro_altitude") or record.get("geo_altitude") or 0
    squawk = record.get("squawk", "")

    if on_ground:
        return False

    # Emergency squawk codes
    if squawk in ("7500", "7600", "7700"):
        record["anomaly_type"] = f"emergency_squawk_{squawk}"
        return True

    # Military callsign
    for prefix in _MILITARY_PREFIXES:
        if callsign.startswith(prefix):
            record["anomaly_type"] = "military_callsign"
            return True

    # Very low altitude over monitored region (potential ISR / military)
    if 0 < altitude < 3000:
        record["anomaly_type"] = "low_altitude"
        return True

    return False


_COUNTRY_MAP: dict[str, str] = {
    "United States": "US", "Russia": "RU", "Russian Federation": "RU",
    "China": "CN", "Palestine": "PS", "Iran": "IR", "Turkey": "TR",
    "United Kingdom": "GB", "France": "FR", "Germany": "DE",
    "Saudi Arabia": "SA", "United Arab Emirates": "AE", "India": "IN",
    "Pakistan": "PK", "Japan": "JP", "South Korea": "KR",
}


def _country_to_iso2(name: str) -> str:
    return _COUNTRY_MAP.get(name, name[:2].upper() if len(name) >= 2 else "XX")
