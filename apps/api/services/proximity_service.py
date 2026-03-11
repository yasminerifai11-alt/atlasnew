"""
Atlas Command — Proximity Service

PostGIS-powered spatial queries:
  - Find infrastructure within N km of an event
  - Find events within N km of a point (user asset)
  - Calculate distances between events and infrastructure
  - Haversine fallback when PostGIS is not available

Uses raw SQL via SQLAlchemy for PostGIS functions (ST_DWithin, ST_Distance).
"""

from __future__ import annotations

import math

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ═══════════════════════════════════════════════════════════════════════
#  HAVERSINE (FALLBACK — NO POSTGIS NEEDED)
# ═══════════════════════════════════════════════════════════════════════

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two points using Haversine formula."""
    rlat1, rlon1, rlat2, rlon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = rlat2 - rlat1
    dlon = rlon2 - rlon1
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


# ═══════════════════════════════════════════════════════════════════════
#  POSTGIS QUERIES
# ═══════════════════════════════════════════════════════════════════════

async def find_nearby_infrastructure(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_km: float = 100.0,
    limit: int = 20,
) -> list[dict]:
    """
    Find infrastructure assets within radius_km of a point.
    Uses PostGIS ST_DWithin for efficient spatial query.
    Falls back to Haversine SQL if PostGIS extension isn't loaded.
    """
    try:
        # PostGIS query — accurate and indexed
        query = text("""
            SELECT
                id, name, infra_type, country, region,
                latitude, longitude, criticality, owner, sector,
                ST_Distance(
                    ST_MakePoint(longitude, latitude)::geography,
                    ST_MakePoint(:lon, :lat)::geography
                ) / 1000.0 AS distance_km
            FROM infrastructure
            WHERE ST_DWithin(
                ST_MakePoint(longitude, latitude)::geography,
                ST_MakePoint(:lon, :lat)::geography,
                :radius_m
            )
            ORDER BY distance_km ASC
            LIMIT :limit
        """)
        result = await db.execute(query, {
            "lat": latitude,
            "lon": longitude,
            "radius_m": radius_km * 1000,
            "limit": limit,
        })
    except Exception:
        # Fallback — Haversine approximation (works without PostGIS)
        query = text("""
            SELECT
                id, name, infra_type, country, region,
                latitude, longitude, criticality, owner, sector,
                (
                    6371 * acos(
                        cos(radians(:lat)) * cos(radians(latitude))
                        * cos(radians(longitude) - radians(:lon))
                        + sin(radians(:lat)) * sin(radians(latitude))
                    )
                ) AS distance_km
            FROM infrastructure
            HAVING distance_km <= :radius_km
            ORDER BY distance_km ASC
            LIMIT :limit
        """)
        result = await db.execute(query, {
            "lat": latitude,
            "lon": longitude,
            "radius_km": radius_km,
            "limit": limit,
        })

    rows = result.mappings().all()
    return [dict(r) for r in rows]


async def find_nearby_events(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_km: float = 200.0,
    limit: int = 50,
) -> list[dict]:
    """
    Find events within radius_km of a point (e.g. user asset location).
    Returns events sorted by distance.
    """
    try:
        query = text("""
            SELECT
                e.id, e.title, e.event_type, e.sector, e.region, e.country,
                e.risk_score, e.risk_level, e.severity,
                e.latitude, e.longitude, e.event_time,
                ST_Distance(
                    ST_MakePoint(e.longitude, e.latitude)::geography,
                    ST_MakePoint(:lon, :lat)::geography
                ) / 1000.0 AS distance_km
            FROM events e
            WHERE ST_DWithin(
                ST_MakePoint(e.longitude, e.latitude)::geography,
                ST_MakePoint(:lon, :lat)::geography,
                :radius_m
            )
            ORDER BY distance_km ASC
            LIMIT :limit
        """)
        result = await db.execute(query, {
            "lat": latitude,
            "lon": longitude,
            "radius_m": radius_km * 1000,
            "limit": limit,
        })
    except Exception:
        query = text("""
            SELECT
                e.id, e.title, e.event_type, e.sector, e.region, e.country,
                e.risk_score, e.risk_level, e.severity,
                e.latitude, e.longitude, e.event_time,
                (
                    6371 * acos(
                        cos(radians(:lat)) * cos(radians(e.latitude))
                        * cos(radians(e.longitude) - radians(:lon))
                        + sin(radians(:lat)) * sin(radians(e.latitude))
                    )
                ) AS distance_km
            FROM events e
            HAVING distance_km <= :radius_km
            ORDER BY distance_km ASC
            LIMIT :limit
        """)
        result = await db.execute(query, {
            "lat": latitude,
            "lon": longitude,
            "radius_km": radius_km,
            "limit": limit,
        })

    rows = result.mappings().all()
    return [dict(r) for r in rows]


async def link_event_to_infrastructure(
    db: AsyncSession,
    event_id: int,
    event_lat: float,
    event_lon: float,
    radius_km: float = 100.0,
) -> list[dict]:
    """
    Find all infrastructure near an event and create/update links.
    Returns the list of infrastructure with distances and impact levels.
    """
    from services.risk_engine import score_to_level

    infra_list = await find_nearby_infrastructure(
        db, event_lat, event_lon, radius_km=radius_km
    )

    links = []
    for infra in infra_list:
        distance = infra["distance_km"]

        # Determine impact type based on distance and infrastructure type
        if distance < 5:
            impact_type = "blast_radius"
        elif distance < 20:
            impact_type = "supply_disruption"
        elif distance < 50:
            impact_type = "route_blockage"
        else:
            impact_type = "regional_exposure"

        # Impact level based on distance + criticality
        criticality = infra.get("criticality", "MEDIUM")
        if distance < 10 and criticality in ("CRITICAL", "HIGH"):
            impact_level = "CRITICAL"
        elif distance < 25:
            impact_level = "HIGH"
        elif distance < 50:
            impact_level = "MEDIUM"
        else:
            impact_level = "LOW"

        # Upsert link
        upsert = text("""
            INSERT INTO event_infrastructure_links
                (event_id, infrastructure_id, distance_km, impact_type, impact_level)
            VALUES (:event_id, :infra_id, :distance, :impact_type, :impact_level)
            ON CONFLICT (event_id, infrastructure_id)
            DO UPDATE SET
                distance_km = :distance,
                impact_type = :impact_type,
                impact_level = :impact_level
            RETURNING id
        """)
        await db.execute(upsert, {
            "event_id": event_id,
            "infra_id": infra["id"],
            "distance": round(distance, 2),
            "impact_type": impact_type,
            "impact_level": impact_level,
        })

        links.append({
            **infra,
            "distance_km": round(distance, 2),
            "impact_type": impact_type,
            "impact_level": impact_level,
        })

    await db.commit()
    return links
