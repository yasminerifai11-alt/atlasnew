"""
Atlas Command — Brief Router

POST /events/{id}/brief — generate AI brief for a single event
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import BriefResponse
from services import llm_service

router = APIRouter()


@router.post("/events/{event_id}/brief", response_model=BriefResponse)
async def generate_event_brief(
    event_id: int,
    lang: str = Query("en", pattern="^(en|ar)$", description="Language: en or ar"),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an AI intelligence brief for a specific event.
    Calls Claude to produce situation, significance, forecast, actions,
    financial impact, and GCC region impact.

    Results are stored in both the events table and the briefs table.
    """
    # Fetch event
    query = text("""
        SELECT id, title, description, event_type, sector, region, country,
               risk_score, risk_level, confidence_score, source
        FROM events WHERE id = :id
    """)
    result = await db.execute(query, {"id": event_id})
    event = result.mappings().first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    # Generate brief via Claude
    brief_data = await llm_service.generate_event_brief(
        title=event["title"],
        description=event["description"],
        event_type=event["event_type"],
        sector=event["sector"],
        region=event["region"],
        country=event["country"],
        risk_score=event["risk_score"],
        risk_level=event["risk_level"],
        confidence_score=event["confidence_score"],
        source=event["source"],
        lang=lang,
    )

    # Parse actions into array
    actions_list = [
        line.strip().lstrip("0123456789.-) ")
        for line in brief_data["actions"].split("\n")
        if line.strip()
    ]

    # Update event with generated intelligence
    suffix = "_ar" if lang == "ar" else "_en"
    await db.execute(
        text(f"""
            UPDATE events SET
                situation{suffix} = :situation,
                why_matters{suffix} = :why_matters,
                forecast{suffix} = :forecast,
                actions{suffix} = :actions,
                financial_impact{suffix} = :financial,
                region_impact{suffix} = :region_impact,
                updated_at = NOW()
            WHERE id = :id
        """),
        {
            "situation": brief_data["situation"],
            "why_matters": brief_data["why_matters"],
            "forecast": brief_data["forecast"],
            "actions": actions_list,
            "financial": brief_data["financial_impact"],
            "region_impact": brief_data["region_impact"],
            "id": event_id,
        },
    )

    # Assemble full brief text
    if lang == "ar":
        full_content = (
            f"تقييم الموقف:\n{brief_data['situation']}\n\n"
            f"لماذا يهم:\n{brief_data['why_matters']}\n\n"
            f"التوقعات:\n{brief_data['forecast']}\n\n"
            f"الإجراءات المطلوبة:\n{brief_data['actions']}\n\n"
            f"الأثر المالي:\n{brief_data['financial_impact']}\n\n"
            f"أثر على دول الخليج:\n{brief_data['region_impact']}"
        )
    else:
        full_content = (
            f"SITUATION ASSESSMENT:\n{brief_data['situation']}\n\n"
            f"WHY IT MATTERS:\n{brief_data['why_matters']}\n\n"
            f"FORECAST:\n{brief_data['forecast']}\n\n"
            f"REQUIRED ACTIONS:\n{brief_data['actions']}\n\n"
            f"FINANCIAL IMPACT:\n{brief_data['financial_impact']}\n\n"
            f"GCC REGION IMPACT:\n{brief_data['region_impact']}"
        )

    # Store in briefs table
    await db.execute(
        text("""
            INSERT INTO briefs (event_id, type, lang, content)
            VALUES (:event_id, 'EVENT', :lang, :content)
        """),
        {"event_id": event_id, "lang": lang, "content": full_content},
    )

    await db.commit()

    return BriefResponse(
        event_id=event_id,
        lang=lang,
        content=full_content,
        generated_at=datetime.now(timezone.utc),
    )
