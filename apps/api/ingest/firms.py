"""
Atlas Command — NASA FIRMS Connector

Fire Information for Resource Management System
https://firms.modaps.eosdis.nasa.gov/
API docs: https://firms.modaps.eosdis.nasa.gov/api/

Schedule: every 30 minutes
"""

from __future__ import annotations

import csv
import io
import logging
import math
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.firms")

# FIRMS active fire data — CSV endpoint for Middle East bounding box
# Format: /api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{W},{S},{E},{N}/{days}
FIRMS_CSV_URL = (
    "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
    "{map_key}/VIIRS_SNPP_NRT/25,12,65,42/1"
)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in km between two lat/lon points."""
    R = 6371.0
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class FIRMSConnector(BaseConnector):
    """Ingest active fire / thermal anomaly data from NASA FIRMS."""

    source_name = "NASA_FIRMS"
    dedup_time_window = timedelta(hours=12)
    dedup_distance_km = 10.0

    def __init__(self, session, firms_map_key: str = "") -> None:
        super().__init__(session)
        self.map_key = firms_map_key

    async def fetch(self) -> list[dict]:
        """Download the FIRMS CSV for Middle East bbox, filter brightness > 330."""
        url = FIRMS_CSV_URL.format(map_key=self.map_key)
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        reader = csv.DictReader(io.StringIO(resp.text))
        records = []
        for row in reader:
            try:
                brightness = float(row.get("bright_ti4", 0) or 0)
            except (ValueError, TypeError):
                continue
            if brightness <= 330:
                continue
            records.append(dict(row))

        # Cluster detections within 5km as single event
        return self._cluster_detections(records, radius_km=5.0)

    def _cluster_detections(self, records: list[dict], radius_km: float) -> list[dict]:
        """Cluster nearby fire detections into single events."""
        if not records:
            return []

        clustered: list[dict] = []
        used = set()

        for i, rec in enumerate(records):
            if i in used:
                continue
            try:
                lat_i = float(rec.get("latitude", 0))
                lon_i = float(rec.get("longitude", 0))
                bright_i = float(rec.get("bright_ti4", 0) or 0)
            except (ValueError, TypeError):
                continue

            cluster_lats = [lat_i]
            cluster_lons = [lon_i]
            cluster_brights = [bright_i]
            cluster_frps = [float(rec.get("frp", 0) or 0)]
            used.add(i)

            for j, rec2 in enumerate(records):
                if j in used:
                    continue
                try:
                    lat_j = float(rec2.get("latitude", 0))
                    lon_j = float(rec2.get("longitude", 0))
                except (ValueError, TypeError):
                    continue
                if _haversine_km(lat_i, lon_i, lat_j, lon_j) <= radius_km:
                    cluster_lats.append(lat_j)
                    cluster_lons.append(lon_j)
                    cluster_brights.append(float(rec2.get("bright_ti4", 0) or 0))
                    cluster_frps.append(float(rec2.get("frp", 0) or 0))
                    used.add(j)

            centroid_rec = dict(rec)
            centroid_rec["latitude"] = str(sum(cluster_lats) / len(cluster_lats))
            centroid_rec["longitude"] = str(sum(cluster_lons) / len(cluster_lons))
            centroid_rec["bright_ti4"] = str(max(cluster_brights))
            centroid_rec["frp"] = str(max(cluster_frps))
            centroid_rec["_cluster_size"] = len(cluster_lats)
            clustered.append(centroid_rec)

        return clustered

    def normalize(self, raw: dict) -> dict | None:
        """Transform a FIRMS CSV row into Atlas event format."""
        try:
            lat = float(raw.get("latitude", 0))
            lon = float(raw.get("longitude", 0))
            brightness = float(raw.get("bright_ti4", 0) or 0)
            frp = float(raw.get("frp", 0) or 0)
        except (ValueError, TypeError):
            return None

        acq_date = raw.get("acq_date", "")
        acq_time = raw.get("acq_time", "0000")
        try:
            event_time = datetime.strptime(
                f"{acq_date} {acq_time}", "%Y-%m-%d %H%M"
            ).replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            event_time = datetime.now(timezone.utc)

        cluster_size = raw.get("_cluster_size", 1)

        # Event type based on brightness
        if brightness > 350:
            event_type = EventType.STRIKE
        else:
            event_type = EventType.GEOPOLITICAL

        # Risk score based on brightness
        if brightness > 400:
            risk_score = 75
            severity = RiskLevel.HIGH
            confidence_score = 90
        elif brightness > 350:
            risk_score = 60
            severity = RiskLevel.HIGH
            confidence_score = 80
        else:
            risk_score = 35
            severity = RiskLevel.MEDIUM
            confidence_score = 70

        country_id = raw.get("country_id", "XX")[:2]
        daynight = raw.get("daynight", "D")

        title = f"Thermal Anomaly — {brightness:.0f}K ({cluster_size} detections)"
        if brightness > 350:
            title = f"Possible Explosion/Fire — {brightness:.0f}K ({cluster_size} detections)"

        description = (
            f"Satellite thermal anomaly detected at {lat:.4f}, {lon:.4f}. "
            f"Brightness: {brightness:.0f}K, FRP: {frp:.1f} MW. "
            f"{cluster_size} detections clustered within 5km. "
            f"Detection: {'daytime' if daynight == 'D' else 'nighttime'}."
        )

        return {
            "title": title,
            "description": description,
            "event_time": event_time,
            "latitude": lat,
            "longitude": lon,
            "region": "Middle East",
            "country": country_id.upper(),
            "event_type": event_type,
            "sector": Sector.ENERGY,
            "source": self.source_name,
            "source_count": cluster_size,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"Satellite-detected thermal anomaly ({brightness:.0f}K brightness, "
                f"{frp:.0f} MW FRP). "
                f"{'HIGH brightness suggests possible explosion or infrastructure fire. ' if brightness > 350 else ''}"
                "Could indicate industrial incident, wildfire, or conflict-related damage."
            ),
            "forecast_en": (
                "Monitor for spread or proximity to critical infrastructure. "
                "Cross-reference with conflict data and ground reports."
            ),
            "actions_en": '{"Monitor fire progression","Assess infrastructure exposure","Cross-reference conflict data","Check air quality impact"}',
        }
