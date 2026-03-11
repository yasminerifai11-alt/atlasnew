"""
Atlas Command — Intelligence Router

POST /intelligence/analyze              — run full analysis pipeline on event
GET  /intelligence/morning-brief        — get today's morning brief
POST /intelligence/morning-brief/generate — generate new morning brief
"""

from __future__ import annotations

from datetime import datetime, date, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    MorningBriefResponse,
    BriefGenerateRequest,
    InfraLinkResponse,
    RiskLevel,
)
from services import risk_engine, consequence_engine, llm_service, proximity_service

router = APIRouter()


# ─── POST /intelligence/analyze ──────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_event(
    req: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run the full analysis pipeline on an event:
    1. Re-score risk based on proximity to infrastructure
    2. Link nearby infrastructure
    3. Generate consequence chain (rule-based + optional LLM)
    4. Generate intelligence briefs in requested languages
    """
    # 1. Fetch event
    event_q = text("""
        SELECT id, title, description, event_type, sector, region, country,
               latitude, longitude, severity, confidence_score, source_count,
               source, risk_score, risk_level
        FROM events WHERE id = :id
    """)
    result = await db.execute(event_q, {"id": req.event_id})
    event = result.mappings().first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Event {req.event_id} not found")

    # 2. Find and link nearby infrastructure
    infra_links = await proximity_service.link_event_to_infrastructure(
        db,
        event_id=event["id"],
        event_lat=event["latitude"],
        event_lon=event["longitude"],
        radius_km=100.0,
    )

    # 3. Re-score risk with infrastructure proximity
    proximities = [
        risk_engine.InfraProximity(
            distance_km=link["distance_km"],
            criticality=link.get("criticality", "MEDIUM"),
        )
        for link in infra_links
    ]
    new_score, new_level = risk_engine.compute_risk(
        event_type=event["event_type"],
        severity=event["severity"],
        confidence_score=event["confidence_score"],
        source_count=event["source_count"],
        nearby_infrastructure=proximities,
    )

    # Update event risk score
    await db.execute(
        text("UPDATE events SET risk_score = :score, risk_level = :level WHERE id = :id"),
        {"score": new_score, "level": new_level.value, "id": req.event_id},
    )

    # 4. Generate consequence chain
    chain_response = None
    if req.generate_consequences:
        # Rule-based chain
        steps = consequence_engine.generate_consequence_chain(
            event_type=event["event_type"],
            sector=event["sector"],
            title=event["title"],
            region=event["region"],
            risk_score=new_score,
        )

        # Store in DB
        await db.execute(
            text("DELETE FROM consequence_chains WHERE event_id = :id"),
            {"id": req.event_id},
        )
        for step in steps:
            await db.execute(
                text("""
                    INSERT INTO consequence_chains
                        (event_id, step_number, domain, consequence_en, consequence_ar, probability, timeframe)
                    VALUES (:event_id, :step, :domain, :en, :ar, :prob, :tf)
                """),
                {
                    "event_id": req.event_id,
                    "step": step.step_number,
                    "domain": step.domain,
                    "en": step.consequence_en,
                    "ar": step.consequence_ar,
                    "prob": step.probability,
                    "tf": step.timeframe,
                },
            )

        from models.schemas import ConsequenceChainResponse, ConsequenceStep as CSSchema
        chain_response = ConsequenceChainResponse(
            event_id=req.event_id,
            event_title=event["title"],
            steps=[
                CSSchema(
                    step_number=s.step_number,
                    domain=s.domain,
                    consequence_en=s.consequence_en,
                    consequence_ar=s.consequence_ar,
                    probability=s.probability,
                    timeframe=s.timeframe,
                )
                for s in steps
            ],
        )

    # 5. Generate intelligence briefs
    brief_en = None
    brief_ar = None

    if req.generate_briefs:
        for lang in req.langs:
            brief_data = await llm_service.generate_event_brief(
                title=event["title"],
                description=event["description"],
                event_type=event["event_type"],
                sector=event["sector"],
                region=event["region"],
                country=event["country"],
                risk_score=new_score,
                risk_level=new_level.value,
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

            suffix = "_ar" if lang == "ar" else "_en"
            await db.execute(
                text(f"""
                    UPDATE events SET
                        situation{suffix} = :situation,
                        why_matters{suffix} = :why_matters,
                        forecast{suffix} = :forecast,
                        actions{suffix} = :actions,
                        financial_impact{suffix} = :financial,
                        region_impact{suffix} = :region_impact
                    WHERE id = :id
                """),
                {
                    "situation": brief_data["situation"],
                    "why_matters": brief_data["why_matters"],
                    "forecast": brief_data["forecast"],
                    "actions": actions_list,
                    "financial": brief_data["financial_impact"],
                    "region_impact": brief_data["region_impact"],
                    "id": req.event_id,
                },
            )

            full_brief = (
                f"SITUATION: {brief_data['situation']}\n\n"
                f"WHY IT MATTERS: {brief_data['why_matters']}\n\n"
                f"FORECAST: {brief_data['forecast']}\n\n"
                f"ACTIONS:\n{brief_data['actions']}\n\n"
                f"FINANCIAL IMPACT: {brief_data['financial_impact']}\n\n"
                f"GCC IMPACT: {brief_data['region_impact']}"
            )

            if lang == "en":
                brief_en = full_brief
            else:
                brief_ar = full_brief

            # Store brief record
            await db.execute(
                text("""
                    INSERT INTO briefs (event_id, type, lang, content)
                    VALUES (:event_id, 'EVENT', :lang, :content)
                """),
                {"event_id": req.event_id, "lang": lang, "content": full_brief},
            )

    await db.commit()

    # Build infrastructure link responses
    infra_link_responses = [
        InfraLinkResponse(
            id=0,
            event_id=req.event_id,
            infrastructure_id=link["id"],
            distance_km=link["distance_km"],
            impact_type=link["impact_type"],
            impact_level=link["impact_level"],
        )
        for link in infra_links
    ]

    return AnalyzeResponse(
        event_id=req.event_id,
        risk_score=new_score,
        risk_level=new_level,
        consequence_chain=chain_response,
        brief_en=brief_en,
        brief_ar=brief_ar,
        infrastructure_links=infra_link_responses,
        generated_at=datetime.now(timezone.utc),
    )


# ─── GET /intelligence/morning-brief ─────────────────────────────────

@router.get("/morning-brief", response_model=MorningBriefResponse | None)
async def get_morning_brief(
    brief_date: date | None = Query(None, description="Date (YYYY-MM-DD). Defaults to today."),
    db: AsyncSession = Depends(get_db),
):
    """Get today's (or specified date's) morning brief."""
    target_date = brief_date or date.today()

    query = text("""
        SELECT id, brief_date, summary_en, summary_ar,
               top_risks_en, top_risks_ar,
               financial_outlook_en, financial_outlook_ar,
               created_at
        FROM morning_briefs
        WHERE brief_date = :target_date
    """)
    result = await db.execute(query, {"target_date": target_date})
    row = result.mappings().first()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"No morning brief found for {target_date}. POST /intelligence/morning-brief/generate to create one.",
        )

    return MorningBriefResponse(
        id=row["id"],
        brief_date=row["brief_date"],
        summary_en=row["summary_en"],
        summary_ar=row.get("summary_ar"),
        top_risks_en=row["top_risks_en"],
        top_risks_ar=row.get("top_risks_ar"),
        financial_outlook_en=row.get("financial_outlook_en"),
        financial_outlook_ar=row.get("financial_outlook_ar"),
        created_at=row["created_at"],
    )


# ─── POST /intelligence/morning-brief/generate ──────────────────────

@router.post("/morning-brief/generate", response_model=MorningBriefResponse)
async def generate_morning_brief(
    db: AsyncSession = Depends(get_db),
):
    """Generate a new morning brief for today in both EN and AR."""
    today = date.today()

    # Fetch top events by risk score
    events_q = text("""
        SELECT id, title, event_type, sector, region, country,
               risk_score, risk_level, situation_en
        FROM events
        ORDER BY risk_score DESC
        LIMIT 10
    """)
    result = await db.execute(events_q)
    event_rows = [dict(r) for r in result.mappings().all()]

    if not event_rows:
        raise HTTPException(status_code=400, detail="No events in database to generate brief from")

    # Generate EN brief
    brief_en = await llm_service.generate_morning_brief(event_rows, lang="en")

    # Generate AR brief
    brief_ar = await llm_service.generate_morning_brief(event_rows, lang="ar")

    # Build top_risks JSON
    top_risks_en = [
        {
            "event_id": e["id"],
            "title": e["title"],
            "risk_level": e["risk_level"],
            "risk_score": e["risk_score"],
        }
        for e in event_rows[:5]
    ]

    # Upsert morning brief
    import json
    upsert = text("""
        INSERT INTO morning_briefs
            (brief_date, summary_en, summary_ar, top_risks_en, top_risks_ar,
             financial_outlook_en, financial_outlook_ar)
        VALUES
            (:date, :summary_en, :summary_ar, :top_risks_en::jsonb, :top_risks_ar::jsonb,
             :fin_en, :fin_ar)
        ON CONFLICT (brief_date)
        DO UPDATE SET
            summary_en = :summary_en,
            summary_ar = :summary_ar,
            top_risks_en = :top_risks_en::jsonb,
            top_risks_ar = :top_risks_ar::jsonb,
            financial_outlook_en = :fin_en,
            financial_outlook_ar = :fin_ar
        RETURNING id, created_at
    """)
    result = await db.execute(upsert, {
        "date": today,
        "summary_en": brief_en["summary"],
        "summary_ar": brief_ar["summary"],
        "top_risks_en": json.dumps(top_risks_en),
        "top_risks_ar": json.dumps(top_risks_en),  # Same structure, titles in EN for now
        "fin_en": brief_en["financial_outlook"],
        "fin_ar": brief_ar["financial_outlook"],
    })
    row = result.mappings().first()
    await db.commit()

    return MorningBriefResponse(
        id=row["id"],
        brief_date=today,
        summary_en=brief_en["summary"],
        summary_ar=brief_ar["summary"],
        top_risks_en=top_risks_en,
        top_risks_ar=top_risks_en,
        financial_outlook_en=brief_en["financial_outlook"],
        financial_outlook_ar=brief_ar["financial_outlook"],
        created_at=row["created_at"],
    )
