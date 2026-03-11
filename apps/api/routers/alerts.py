"""
Atlas Command — Alerts Router

POST   /alerts              — create alert
GET    /alerts/{session_id} — get user alerts
DELETE /alerts/{id}         — delete alert
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import AlertCreate, AlertResponse

router = APIRouter()


# ─── POST /alerts ────────────────────────────────────────────────────

@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(
    alert: AlertCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new alert trigger.

    Trigger types:
      - REGION: fires when events occur in a specific region
      - SECTOR: fires when events hit a specific sector
      - RISK_LEVEL: fires when events reach a risk level (e.g. "CRITICAL")
      - KEYWORD: fires when event title/description matches keyword
      - ASSET_PROXIMITY: fires when events occur near a tracked asset (lat,lng,radius_km)
    """
    query = text("""
        INSERT INTO alerts (user_session, name, trigger_type, trigger_value, is_active)
        VALUES (:user_session, :name, :trigger_type, :trigger_value, TRUE)
        RETURNING id, user_session, name, trigger_type, trigger_value, is_active, created_at
    """)
    result = await db.execute(query, {
        "user_session": alert.user_session,
        "name": alert.name,
        "trigger_type": alert.trigger_type.value,
        "trigger_value": alert.trigger_value,
    })
    row = result.mappings().first()
    await db.commit()

    return AlertResponse(
        id=row["id"],
        user_session=row["user_session"],
        name=row["name"],
        trigger_type=row["trigger_type"],
        trigger_value=row["trigger_value"],
        is_active=row["is_active"],
        created_at=row["created_at"],
    )


# ─── GET /alerts/{session_id} ───────────────────────────────────────

@router.get("/{session_id}", response_model=list[AlertResponse])
async def get_user_alerts(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all alerts for a user session."""
    query = text("""
        SELECT id, user_session, name, trigger_type, trigger_value, is_active, created_at
        FROM alerts
        WHERE user_session = :session_id
        ORDER BY created_at DESC
    """)
    result = await db.execute(query, {"session_id": session_id})
    rows = result.mappings().all()

    return [
        AlertResponse(
            id=r["id"],
            user_session=r["user_session"],
            name=r["name"],
            trigger_type=r["trigger_type"],
            trigger_value=r["trigger_value"],
            is_active=r["is_active"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


# ─── DELETE /alerts/{id} ────────────────────────────────────────────

@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete an alert by ID."""
    result = await db.execute(
        text("DELETE FROM alerts WHERE id = :id RETURNING id"),
        {"id": alert_id},
    )
    row = result.mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    await db.commit()
