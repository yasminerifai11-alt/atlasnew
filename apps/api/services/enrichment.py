"""
Atlas Command — AI Enrichment Pipeline

For every new raw event, call Claude API to generate full bilingual
intelligence briefs with consequence chains.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

import anthropic

from core.config import settings

logger = logging.getLogger("atlas.enrichment")

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = (
    "You are an Atlas Command intelligence analyst. Generate decision-grade "
    "intelligence briefs for senior leaders in the GCC region. Be specific, "
    "name actual locations and impacts. Never be generic."
)

USER_PROMPT_TEMPLATE = """Enrich this event with full intelligence.

Event:
Title: {title}
Type: {event_type}
Location: {country}, {region}
Date: {event_time}
Details: {description}
Risk Score: {risk_score}

Return ONLY valid JSON with no other text:
{{
  "situation_en": "factual 2-3 sentence summary of exactly what happened",
  "situation_ar": "same in formal Arabic MSA",
  "why_matters_en": "2-3 sentences on strategic significance specifically for GCC leaders",
  "why_matters_ar": "same in Arabic MSA",
  "forecast_en": "what happens next in 48-72 hours with specific probability percentages",
  "forecast_ar": "same in Arabic MSA",
  "actions_en": [
    "5 specific operational actions",
    "not generic advice",
    "name actual steps leaders take",
    "be precise about what to do",
    "include concrete next steps"
  ],
  "actions_ar": ["same 5 in Arabic MSA", "action 2", "action 3", "action 4", "action 5"],
  "financial_impact_en": "oil price impact, currency exposure, market implications in 2 specific sentences",
  "financial_impact_ar": "same in Arabic",
  "gcc_impact_en": "what this means specifically for Kuwait, Saudi Arabia, UAE — name the countries",
  "gcc_impact_ar": "same in Arabic MSA",
  "consequence_chain": [
    {{
      "step": 1,
      "domain": "ENERGY or MARKETS or TRADE or SECURITY or DIPLOMATIC or HUMANITARIAN",
      "consequence_en": "one specific sentence",
      "consequence_ar": "same in Arabic",
      "probability": 90,
      "timeframe": "0-24 hours"
    }},
    {{
      "step": 2,
      "domain": "MARKETS",
      "consequence_en": "one specific sentence",
      "consequence_ar": "same in Arabic",
      "probability": 75,
      "timeframe": "24-48 hours"
    }},
    {{
      "step": 3,
      "domain": "TRADE",
      "consequence_en": "one specific sentence",
      "consequence_ar": "same in Arabic",
      "probability": 60,
      "timeframe": "48-72 hours"
    }},
    {{
      "step": 4,
      "domain": "DIPLOMATIC",
      "consequence_en": "one specific sentence",
      "consequence_ar": "same in Arabic",
      "probability": 45,
      "timeframe": "3-7 days"
    }},
    {{
      "step": 5,
      "domain": "HUMANITARIAN",
      "consequence_en": "one specific sentence",
      "consequence_ar": "same in Arabic",
      "probability": 30,
      "timeframe": "1-2 weeks"
    }}
  ]
}}

Critical rules:
- Every field must be specific not generic
- Name actual countries, cities, prices
- Arabic must be formal MSA suitable for government and executive audiences
- Probabilities must be realistic and decrease each step
- Return valid JSON only, no markdown"""


async def enrich_event(event: dict) -> dict | None:
    """
    Call Claude API to enrich an event with full bilingual intelligence.

    Returns dict with all enrichment fields, or None if enrichment fails.
    """
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "I_will_add_this_manually":
        logger.warning("Enrichment skipped — no ANTHROPIC_API_KEY configured")
        return None

    client = _get_client()

    prompt = USER_PROMPT_TEMPLATE.format(
        title=event.get("title", ""),
        event_type=event.get("event_type", ""),
        country=event.get("country", ""),
        region=event.get("region", ""),
        event_time=event.get("event_time", ""),
        description=event.get("description", ""),
        risk_score=event.get("risk_score", 50),
    )

    # Try up to 2 times
    for attempt in range(2):
        try:
            message = await client.messages.create(
                model=MODEL,
                max_tokens=2000,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )

            text = message.content[0].text.strip()

            # Strip markdown fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            enrichment = json.loads(text)

            # Validate required fields
            required = ["situation_en", "situation_ar", "why_matters_en", "forecast_en", "actions_en"]
            if not all(enrichment.get(k) for k in required):
                logger.warning("Enrichment missing required fields on attempt %d", attempt + 1)
                continue

            return enrichment

        except json.JSONDecodeError:
            logger.warning("Enrichment JSON parse failed on attempt %d", attempt + 1)
            continue
        except Exception:
            logger.exception("Enrichment API call failed on attempt %d", attempt + 1)
            continue

    logger.error("Enrichment failed after 2 attempts for: %s", event.get("title", ""))
    return None


async def apply_enrichment(session, event_id: int, enrichment: dict) -> bool:
    """
    Apply enrichment data to an existing event record in the database.
    Returns True if update succeeded.
    """
    from sqlalchemy import text

    actions_en = enrichment.get("actions_en", [])
    actions_ar = enrichment.get("actions_ar", [])

    # Convert list to PostgreSQL array literal
    if isinstance(actions_en, list):
        actions_en_str = "{" + ",".join(f'"{a}"' for a in actions_en) + "}"
    else:
        actions_en_str = actions_en

    if isinstance(actions_ar, list):
        actions_ar_str = "{" + ",".join(f'"{a}"' for a in actions_ar) + "}"
    else:
        actions_ar_str = actions_ar or "{}"

    try:
        query = text("""
            UPDATE events SET
                situation_en = :situation_en,
                situation_ar = :situation_ar,
                why_matters_en = :why_matters_en,
                why_matters_ar = :why_matters_ar,
                forecast_en = :forecast_en,
                forecast_ar = :forecast_ar,
                actions_en = :actions_en,
                actions_ar = :actions_ar,
                financial_impact_en = :financial_impact_en,
                financial_impact_ar = :financial_impact_ar,
                region_impact_en = :region_impact_en,
                region_impact_ar = :region_impact_ar,
                updated_at = :updated_at
            WHERE id = :event_id
        """)

        await session.execute(query, {
            "event_id": event_id,
            "situation_en": enrichment.get("situation_en", ""),
            "situation_ar": enrichment.get("situation_ar"),
            "why_matters_en": enrichment.get("why_matters_en", ""),
            "why_matters_ar": enrichment.get("why_matters_ar"),
            "forecast_en": enrichment.get("forecast_en", ""),
            "forecast_ar": enrichment.get("forecast_ar"),
            "actions_en": actions_en_str,
            "actions_ar": actions_ar_str,
            "financial_impact_en": enrichment.get("financial_impact_en"),
            "financial_impact_ar": enrichment.get("financial_impact_ar"),
            "region_impact_en": enrichment.get("gcc_impact_en"),
            "region_impact_ar": enrichment.get("gcc_impact_ar"),
            "updated_at": datetime.now(timezone.utc),
        })
        await session.commit()
        logger.info("Enrichment applied to event %d", event_id)
        return True

    except Exception:
        logger.exception("Failed to apply enrichment to event %d", event_id)
        return False


async def insert_consequence_chain(session, event_id: int, chain: list[dict]) -> int:
    """Insert consequence chain steps for an enriched event. Returns count inserted."""
    from sqlalchemy import text

    inserted = 0
    for step in chain:
        try:
            query = text("""
                INSERT INTO consequence_chains (
                    event_id, step_number, domain,
                    consequence_en, consequence_ar,
                    probability, timeframe,
                    created_at
                ) VALUES (
                    :event_id, :step_number, :domain,
                    :consequence_en, :consequence_ar,
                    :probability, :timeframe,
                    :created_at
                )
                ON CONFLICT DO NOTHING
            """)
            await session.execute(query, {
                "event_id": event_id,
                "step_number": step.get("step", 0),
                "domain": step.get("domain", "SECURITY"),
                "consequence_en": step.get("consequence_en", ""),
                "consequence_ar": step.get("consequence_ar"),
                "probability": step.get("probability", 50),
                "timeframe": step.get("timeframe", "24-48 hours"),
                "created_at": datetime.now(timezone.utc),
            })
            inserted += 1
        except Exception:
            logger.exception("Failed to insert consequence step %d for event %d",
                             step.get("step", 0), event_id)
    await session.commit()
    return inserted


async def enrich_and_save(session, event_id: int, event_data: dict) -> bool:
    """
    Full enrichment pipeline: enrich event via Claude, update DB, insert consequences.
    """
    enrichment = await enrich_event(event_data)
    if not enrichment:
        return False

    success = await apply_enrichment(session, event_id, enrichment)
    if not success:
        return False

    chain = enrichment.get("consequence_chain", [])
    if chain:
        await insert_consequence_chain(session, event_id, chain)

    logger.info("Full enrichment complete for event %d: %s", event_id, event_data.get("title", ""))
    return True
