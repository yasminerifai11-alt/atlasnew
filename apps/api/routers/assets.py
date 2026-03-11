"""
Atlas Command — Assets Router

POST /assets/profile              — save user asset profile
GET  /assets/{session_id}/exposure — get exposure analysis for user's assets
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import (
    UserProfileCreate,
    UserProfileResponse,
    ExposureAnalysis,
    AssetExposure,
    AssetDefinition,
    NearbyEventSummary,
    RiskLevel,
)
from services import proximity_service
from services.risk_engine import score_to_level

router = APIRouter()


# ─── POST /assets/profile ───────────────────────────────────────────

@router.post("/profile", response_model=UserProfileResponse, status_code=201)
async def save_user_profile(
    profile: UserProfileCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Save or update a user's asset profile.

    Assets are custom-tracked locations (refineries, ports, pipelines, offices)
    that the user wants exposure analysis for.
    """
    assets_json = json.dumps([a.model_dump() for a in profile.assets])

    query = text("""
        INSERT INTO user_profiles
            (session_id, organisation_type, focus_regions, focus_sectors, assets)
        VALUES
            (:session_id, :org_type, :focus_regions, :focus_sectors, :assets::jsonb)
        ON CONFLICT (session_id)
        DO UPDATE SET
            organisation_type = :org_type,
            focus_regions = :focus_regions,
            focus_sectors = :focus_sectors,
            assets = :assets::jsonb
        RETURNING id, session_id, organisation_type, focus_regions, focus_sectors, assets, created_at
    """)
    result = await db.execute(query, {
        "session_id": profile.session_id,
        "org_type": profile.organisation_type,
        "focus_regions": profile.focus_regions,
        "focus_sectors": profile.focus_sectors,
        "assets": assets_json,
    })
    row = result.mappings().first()
    await db.commit()

    return UserProfileResponse(
        id=row["id"],
        session_id=row["session_id"],
        organisation_type=row["organisation_type"],
        focus_regions=list(row["focus_regions"]) if row["focus_regions"] else [],
        focus_sectors=list(row["focus_sectors"]) if row["focus_sectors"] else [],
        assets=row["assets"],
        created_at=row["created_at"],
    )


# ─── GET /assets/{session_id}/exposure ───────────────────────────────

@router.get("/{session_id}/exposure", response_model=ExposureAnalysis)
async def get_asset_exposure(
    session_id: str,
    radius_km: float = 200.0,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyse exposure for all of a user's tracked assets.

    For each asset:
    1. Find events within radius_km using PostGIS
    2. Compute per-asset threat level (max risk of nearby events)
    3. Return sorted by highest threat first

    Overall threat = max of all asset threat levels.
    """
    # Fetch profile
    profile_q = text("""
        SELECT id, session_id, assets FROM user_profiles WHERE session_id = :sid
    """)
    result = await db.execute(profile_q, {"sid": session_id})
    profile = result.mappings().first()

    if not profile:
        raise HTTPException(status_code=404, detail=f"No profile found for session {session_id}")

    assets_data = profile["assets"]
    if not assets_data:
        raise HTTPException(status_code=400, detail="Profile has no tracked assets")

    # Parse assets
    if isinstance(assets_data, str):
        assets_data = json.loads(assets_data)

    asset_exposures: list[AssetExposure] = []
    overall_max_score = 0

    for asset_raw in assets_data:
        asset = AssetDefinition(**asset_raw)

        # Find nearby events
        nearby = await proximity_service.find_nearby_events(
            db,
            latitude=asset.latitude,
            longitude=asset.longitude,
            radius_km=radius_km,
            limit=20,
        )

        # Build summaries
        nearby_summaries = []
        max_score = 0
        for evt in nearby:
            score = evt.get("risk_score", 0)
            if score > max_score:
                max_score = score
            nearby_summaries.append(NearbyEventSummary(
                event_id=evt["id"],
                title=evt["title"],
                distance_km=round(evt["distance_km"], 1),
                risk_level=evt["risk_level"],
                risk_score=score,
                event_type=evt["event_type"],
            ))

        if max_score > overall_max_score:
            overall_max_score = max_score

        asset_exposures.append(AssetExposure(
            asset=asset,
            nearby_events=nearby_summaries,
            threat_level=score_to_level(max_score) if nearby_summaries else RiskLevel.LOW,
            max_risk_score=max_score,
        ))

    # Sort by highest threat first
    asset_exposures.sort(key=lambda a: a.max_risk_score, reverse=True)

    return ExposureAnalysis(
        session_id=session_id,
        assets=asset_exposures,
        overall_threat=score_to_level(overall_max_score) if asset_exposures else RiskLevel.LOW,
        generated_at=datetime.now(timezone.utc),
    )
