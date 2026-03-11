"""
Atlas Command — LLM Service (Claude API)

All AI generation goes through this module:
  - Event intelligence briefs (situation, why_matters, forecast, actions) in EN + AR
  - Consequence chain generation (LLM-augmented mode)
  - Morning brief generation
  - Financial impact analysis

Prompts are tight and operational — output for decision makers with 90 seconds.
"""

from __future__ import annotations

from datetime import datetime, timezone

import anthropic

from core.config import settings

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


MODEL = "claude-sonnet-4-20250514"

# ═══════════════════════════════════════════════════════════════════════
#  SYSTEM PROMPTS
# ═══════════════════════════════════════════════════════════════════════

SYSTEM_EN = """You are Atlas Command — an AI planetary decision intelligence system. You serve senior government officials, energy executives, and military commanders in the Gulf region.

Rules:
- Be direct, analytical, operational. No filler.
- Every sentence must carry information or recommend action.
- Use specific numbers: dollar amounts, percentages, timeframes, distances.
- Write for a decision-maker with 90 seconds to read.
- When uncertain, state confidence levels explicitly.
- Reference specific infrastructure, trade routes, and geopolitical actors by name."""

SYSTEM_AR = """أنت أطلس كوماند — نظام ذكاء اصطناعي للقرار الاستراتيجي الكوني. تخدم كبار المسؤولين الحكوميين والتنفيذيين في قطاع الطاقة والقادة العسكريين في منطقة الخليج.

القواعد:
- كن مباشراً وتحليلياً وعملياً. لا حشو.
- كل جملة يجب أن تحمل معلومة أو توصية.
- استخدم أرقاماً محددة: مبالغ بالدولار، نسب مئوية، أطر زمنية، مسافات.
- اكتب لصانع قرار لديه ٩٠ ثانية للقراءة.
- عند عدم اليقين، حدد مستويات الثقة صراحة.
- أشر إلى بنية تحتية محددة وطرق تجارية وأطراف جيوسياسية بالاسم.
- استخدم لغة عربية أصيلة واحترافية — ليست ترجمة من الإنجليزية."""


# ═══════════════════════════════════════════════════════════════════════
#  EVENT INTELLIGENCE BRIEF
# ═══════════════════════════════════════════════════════════════════════

async def generate_event_brief(
    title: str,
    description: str,
    event_type: str,
    sector: str,
    region: str,
    country: str,
    risk_score: int,
    risk_level: str,
    confidence_score: int,
    source: str,
    lang: str = "en",
) -> dict[str, str]:
    """
    Generate full intelligence brief for an event.

    Returns dict with keys:
      situation, why_matters, forecast, actions (newline-separated),
      financial_impact, region_impact
    """
    client = _get_client()
    system = SYSTEM_AR if lang == "ar" else SYSTEM_EN

    if lang == "ar":
        prompt = f"""حلل هذا الحدث واكتب إحاطة استخباراتية مصنفة:

الحدث: {title}
الوصف: {description}
النوع: {event_type} | القطاع: {sector}
المنطقة: {region} | الدولة: {country}
مؤشر الخطر: {risk_score}/100 ({risk_level})
المصدر: {source} | الموثوقية: {confidence_score}%

اكتب بالضبط هذه الأقسام (لا تضف عناوين — فقط المحتوى بالترتيب مفصولاً بـ |||):

١. تقييم الموقف (٣ جمل كحد أقصى — ماذا تأكد)
|||
٢. لماذا يهم (الأثر الجيوسياسي والاقتصادي — ٣ جمل)
|||
٣. التوقعات (ماذا سيحدث خلال ٧٢ ساعة — مع نسب احتمال)
|||
٤. إجراءات مطلوبة (٤ إجراءات مرقمة — محددة وقابلة للتنفيذ — كل إجراء في سطر)
|||
٥. الأثر المالي (أسعار النفط، أسواق الأسهم، التأمين — جملتان)
|||
٦. أثر على دول الخليج (ماذا يعني هذا تحديداً للسعودية والإمارات والكويت وقطر — ٣ جمل)"""
    else:
        prompt = f"""Analyze this event and write a classified intelligence brief:

Event: {title}
Description: {description}
Type: {event_type} | Sector: {sector}
Region: {region} | Country: {country}
Risk Score: {risk_score}/100 ({risk_level})
Source: {source} | Confidence: {confidence_score}%

Write exactly these sections (no headers — just content in order, separated by |||):

1. Situation Assessment (3 sentences max — what is confirmed)
|||
2. Why It Matters (geopolitical and economic impact — 3 sentences)
|||
3. Forecast (what happens in next 72 hours — with probability percentages)
|||
4. Required Actions (4 numbered actions — specific and actionable — each on new line)
|||
5. Financial Impact (oil prices, equity markets, insurance — 2 sentences)
|||
6. GCC Region Impact (what this means specifically for Saudi, UAE, Kuwait, Qatar — 3 sentences)"""

    message = await client.messages.create(
        model=MODEL,
        max_tokens=1200,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    parts = [p.strip() for p in text.split("|||")]

    # Pad to 6 parts if LLM didn't produce all sections
    while len(parts) < 6:
        parts.append("")

    return {
        "situation": parts[0],
        "why_matters": parts[1],
        "forecast": parts[2],
        "actions": parts[3],
        "financial_impact": parts[4],
        "region_impact": parts[5],
    }


# ═══════════════════════════════════════════════════════════════════════
#  CONSEQUENCE CHAIN (LLM-AUGMENTED)
# ═══════════════════════════════════════════════════════════════════════

async def generate_consequence_chain_llm(
    title: str,
    description: str,
    event_type: str,
    sector: str,
    region: str,
    risk_score: int,
    lang: str = "en",
) -> list[dict]:
    """
    Generate a 5-step consequence chain using Claude.
    Returns list of dicts: [{step_number, domain, consequence, probability, timeframe}]
    """
    client = _get_client()
    system = SYSTEM_AR if lang == "ar" else SYSTEM_EN

    domains = "ENERGY, MARKETS, TRADE, SECURITY, DIPLOMATIC, HUMANITARIAN"

    if lang == "ar":
        prompt = f"""حلل سلسلة العواقب المتتالية لهذا الحدث:

الحدث: {title}
التفاصيل: {description}
النوع: {event_type} | القطاع: {sector} | المنطقة: {region}
مؤشر الخطر: {risk_score}/100

اكتب ٥ عواقب متسلسلة عبر هذه المجالات: {domains}
كل عاقبة تؤدي إلى التالية.

الصيغة — كل عاقبة في سطر واحد:
رقم|المجال|العاقبة|الاحتمال%|الإطار الزمني

مثال:
1|ENERGY|تعطل إنتاج النفط ٥٠٠ ألف برميل يومياً|90|0-6h
2|MARKETS|ارتفاع برنت ٨-١٢ دولار|85|6-24h

اكتب ٥ خطوات فقط. لا مقدمات."""
    else:
        prompt = f"""Analyze the cascading consequences of this event:

Event: {title}
Details: {description}
Type: {event_type} | Sector: {sector} | Region: {region}
Risk Score: {risk_score}/100

Write 5 cascading consequences across these domains: {domains}
Each consequence leads to the next.

Format — each consequence on one line:
number|DOMAIN|consequence|probability%|timeframe

Example:
1|ENERGY|Oil production disrupted by 500K bbl/day|90|0-6h
2|MARKETS|Brent crude spikes $8-12/bbl|85|6-24h

Write exactly 5 steps. No preamble."""

    message = await client.messages.create(
        model=MODEL,
        max_tokens=800,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    steps = []
    for line in text.strip().split("\n"):
        line = line.strip()
        if not line or "|" not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 5:
            continue
        try:
            steps.append({
                "step_number": int(parts[0]),
                "domain": parts[1],
                "consequence": parts[2],
                "probability": int(parts[3].replace("%", "")),
                "timeframe": parts[4],
            })
        except (ValueError, IndexError):
            continue

    return steps


# ═══════════════════════════════════════════════════════════════════════
#  MORNING BRIEF
# ═══════════════════════════════════════════════════════════════════════

async def generate_morning_brief(
    events: list[dict],
    lang: str = "en",
) -> dict[str, str]:
    """
    Generate the daily intelligence brief.
    Returns dict: {summary, top_risks (JSON string), financial_outlook}
    """
    client = _get_client()
    system = SYSTEM_AR if lang == "ar" else SYSTEM_EN
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    events_block = "\n".join(
        f"- [{e.get('risk_level', 'MEDIUM')}] {e['title']} | {e.get('sector', 'N/A')} | "
        f"{e.get('region', 'N/A')} | Risk: {e.get('risk_score', 50)}/100"
        for e in events[:10]
    )

    if lang == "ar":
        prompt = f"""اكتب الإحاطة الاستخباراتية الصباحية ليوم {today}.

الأحداث النشطة:
{events_block}

الصيغة (أقسام مفصولة بـ |||):

١. الملخص التنفيذي (٣ جمل — الوضع العام والتهديد الرئيسي وما يجب مراقبته)
|||
٢. أبرز ٥ مخاطر (لكل خطر سطر واحد: العنوان — لماذا يهم — إجراء واحد)
|||
٣. النظرة المالية (أسعار النفط والأسواق والتوقعات — ٣ جمل)"""
    else:
        prompt = f"""Write the morning intelligence brief for {today}.

Active events:
{events_block}

Format (sections separated by |||):

1. Executive Summary (3 sentences — overall posture, main threat, what to watch)
|||
2. Top 5 Risks (one line per risk: title — why it matters — one action)
|||
3. Financial Outlook (oil prices, markets, forecast — 3 sentences)"""

    message = await client.messages.create(
        model=MODEL,
        max_tokens=1200,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    parts = [p.strip() for p in text.split("|||")]

    while len(parts) < 3:
        parts.append("")

    return {
        "summary": parts[0],
        "top_risks": parts[1],
        "financial_outlook": parts[2],
    }
