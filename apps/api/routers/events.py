"""
Atlas Command — Events Router

GET  /events              — list events with filters
GET  /events/{id}         — single event with full intelligence
GET  /events/{id}/consequences — consequence chain
GET  /events/{id}/infra   — nearby infrastructure links
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text, desc
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import (
    EventResponse,
    EventListResponse,
    ConsequenceChainResponse,
    ConsequenceStep,
    InfraLinkResponse,
    InfrastructureResponse,
    EventType,
    Sector,
    RiskLevel,
)

router = APIRouter()


# ─── GET /events ─────────────────────────────────────────────────────

@router.get("", response_model=EventListResponse)
async def list_events(
    region: str | None = Query(None, description="Filter by region name"),
    sector: Sector | None = Query(None, description="Filter by sector"),
    risk_level: RiskLevel | None = Query(None, description="Filter by risk level"),
    event_type: EventType | None = Query(None, description="Filter by event type"),
    country: str | None = Query(None, max_length=2, description="ISO alpha-2 country code"),
    time_from: datetime | None = Query(None, description="Events after this time"),
    time_to: datetime | None = Query(None, description="Events before this time"),
    search: str | None = Query(None, description="Full-text search in title and situation"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List all events with optional filters. Ordered by risk_score desc, then event_time desc."""

    # Build dynamic WHERE clause
    conditions = []
    params: dict = {}

    if region:
        conditions.append("e.region ILIKE :region")
        params["region"] = f"%{region}%"
    if sector:
        conditions.append("e.sector = :sector")
        params["sector"] = sector.value
    if risk_level:
        conditions.append("e.risk_level = :risk_level")
        params["risk_level"] = risk_level.value
    if event_type:
        conditions.append("e.event_type = :event_type")
        params["event_type"] = event_type.value
    if country:
        conditions.append("e.country = :country")
        params["country"] = country.upper()
    if time_from:
        conditions.append("e.event_time >= :time_from")
        params["time_from"] = time_from
    if time_to:
        conditions.append("e.event_time <= :time_to")
        params["time_to"] = time_to
    if search:
        conditions.append("(e.title ILIKE :search OR e.situation_en ILIKE :search OR e.situation_ar ILIKE :search)")
        params["search"] = f"%{search}%"

    where_clause = " AND ".join(conditions) if conditions else "TRUE"

    # Count total
    count_query = text(f"SELECT COUNT(*) FROM events e WHERE {where_clause}")
    count_result = await db.execute(count_query, params)
    total = count_result.scalar()

    # Fetch page
    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT
            e.id, e.title, e.description, e.event_time,
            e.latitude, e.longitude, e.region, e.country,
            e.event_type, e.sector, e.source, e.source_count, e.confidence_score,
            e.severity, e.risk_score, e.risk_level,
            e.situation_en, e.why_matters_en, e.forecast_en, e.actions_en,
            e.financial_impact_en, e.region_impact_en,
            e.situation_ar, e.why_matters_ar, e.forecast_ar, e.actions_ar,
            e.financial_impact_ar, e.region_impact_ar,
            e.created_at, e.updated_at
        FROM events e
        WHERE {where_clause}
        ORDER BY e.risk_score DESC, e.event_time DESC
        LIMIT :limit OFFSET :offset
    """)
    result = await db.execute(data_query, params)
    rows = result.mappings().all()

    events = [_row_to_event(r) for r in rows]

    return EventListResponse(
        events=events,
        total=total,
        page=page,
        page_size=page_size,
    )


# ─── GET /events/{id} ───────────────────────────────────────────────

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single event with full intelligence data."""
    query = text("""
        SELECT
            e.id, e.title, e.description, e.event_time,
            e.latitude, e.longitude, e.region, e.country,
            e.event_type, e.sector, e.source, e.source_count, e.confidence_score,
            e.severity, e.risk_score, e.risk_level,
            e.situation_en, e.why_matters_en, e.forecast_en, e.actions_en,
            e.financial_impact_en, e.region_impact_en,
            e.situation_ar, e.why_matters_ar, e.forecast_ar, e.actions_ar,
            e.financial_impact_ar, e.region_impact_ar,
            e.created_at, e.updated_at
        FROM events e
        WHERE e.id = :event_id
    """)
    result = await db.execute(query, {"event_id": event_id})
    row = result.mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    return _row_to_event(row)


# ─── GET /events/{id}/consequences ───────────────────────────────────

@router.get("/{event_id}/consequences", response_model=ConsequenceChainResponse)
async def get_event_consequences(
    event_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get the consequence chain for an event."""
    # Verify event exists
    event_q = text("SELECT id, title FROM events WHERE id = :id")
    event_result = await db.execute(event_q, {"id": event_id})
    event_row = event_result.mappings().first()

    if not event_row:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    # Fetch chain
    chain_q = text("""
        SELECT step_number, domain, consequence_en, consequence_ar, probability, timeframe
        FROM consequence_chains
        WHERE event_id = :event_id
        ORDER BY step_number ASC
    """)
    result = await db.execute(chain_q, {"event_id": event_id})
    rows = result.mappings().all()

    steps = [
        ConsequenceStep(
            step_number=r["step_number"],
            domain=r["domain"],
            consequence_en=r["consequence_en"],
            consequence_ar=r.get("consequence_ar"),
            probability=r["probability"],
            timeframe=r["timeframe"],
        )
        for r in rows
    ]

    return ConsequenceChainResponse(
        event_id=event_id,
        event_title=event_row["title"],
        steps=steps,
    )


# ─── GET /events/{id}/infra ─────────────────────────────────────────

@router.get("/{event_id}/infra", response_model=list[InfraLinkResponse])
async def get_event_infrastructure(
    event_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get infrastructure exposure for an event."""
    query = text("""
        SELECT
            eil.id, eil.event_id, eil.infrastructure_id,
            eil.distance_km, eil.impact_type, eil.impact_level,
            i.id AS i_id, i.name AS i_name, i.infra_type AS i_infra_type,
            i.country AS i_country, i.region AS i_region,
            i.latitude AS i_lat, i.longitude AS i_lon,
            i.criticality AS i_criticality, i.owner AS i_owner,
            i.sector AS i_sector, i.created_at AS i_created_at
        FROM event_infrastructure_links eil
        JOIN infrastructure i ON i.id = eil.infrastructure_id
        WHERE eil.event_id = :event_id
        ORDER BY eil.distance_km ASC
    """)
    result = await db.execute(query, {"event_id": event_id})
    rows = result.mappings().all()

    links = []
    for r in rows:
        infra = InfrastructureResponse(
            id=r["i_id"],
            name=r["i_name"],
            infra_type=r["i_infra_type"],
            country=r["i_country"],
            region=r["i_region"],
            latitude=r["i_lat"],
            longitude=r["i_lon"],
            criticality=r["i_criticality"],
            owner=r["i_owner"],
            sector=r["i_sector"],
            created_at=r["i_created_at"],
        )
        links.append(InfraLinkResponse(
            id=r["id"],
            event_id=r["event_id"],
            infrastructure_id=r["infrastructure_id"],
            distance_km=r["distance_km"],
            impact_type=r["impact_type"],
            impact_level=r["impact_level"],
            infrastructure=infra,
        ))

    return links


# ─── Helpers ─────────────────────────────────────────────────────────

def _row_to_event(r) -> EventResponse:
    """Convert a DB row mapping to EventResponse."""
    return EventResponse(
        id=r["id"],
        title=r["title"],
        description=r["description"],
        event_time=r["event_time"],
        latitude=r["latitude"],
        longitude=r["longitude"],
        region=r["region"],
        country=r["country"],
        event_type=r["event_type"],
        sector=r["sector"],
        source=r["source"],
        source_count=r["source_count"],
        confidence_score=r["confidence_score"],
        severity=r["severity"],
        risk_score=r["risk_score"],
        risk_level=r["risk_level"],
        situation_en=r["situation_en"],
        why_matters_en=r["why_matters_en"],
        forecast_en=r["forecast_en"],
        actions_en=list(r["actions_en"]) if r["actions_en"] else [],
        financial_impact_en=r.get("financial_impact_en"),
        region_impact_en=r.get("region_impact_en"),
        situation_ar=r.get("situation_ar"),
        why_matters_ar=r.get("why_matters_ar"),
        forecast_ar=r.get("forecast_ar"),
        actions_ar=list(r["actions_ar"]) if r.get("actions_ar") else [],
        financial_impact_ar=r.get("financial_impact_ar"),
        region_impact_ar=r.get("region_impact_ar"),
        created_at=r["created_at"],
        updated_at=r["updated_at"],
    )
