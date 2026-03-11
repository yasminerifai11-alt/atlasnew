"""
Atlas Command — Consequence Chain Engine

Given an event, generates a cascade of 4–6 consequences across domains.
Each consequence has a probability (0–100) and timeframe.

Domains: ENERGY, MARKETS, TRADE, SECURITY, DIPLOMATIC, HUMANITARIAN

Two modes:
  1. Rule-based: fast, deterministic, no API call
  2. LLM-augmented: calls Claude for richer analysis (via llm_service)
"""

from __future__ import annotations

from dataclasses import dataclass, field

from models.schemas import EventType, Sector, ConsequenceDomain, RiskLevel


@dataclass
class ConsequenceStep:
    step_number: int
    domain: str
    consequence_en: str
    consequence_ar: str | None = None
    probability: int = 70
    timeframe: str = "6-24h"


# ═══════════════════════════════════════════════════════════════════════
#  RULE-BASED CONSEQUENCE TEMPLATES
# ═══════════════════════════════════════════════════════════════════════

# Each template is a function that takes event data and returns steps.
# Templates are keyed by (event_type, sector) pairs.

def _energy_strike_chain(title: str, region: str, risk_score: int) -> list[ConsequenceStep]:
    severity_word = "severe" if risk_score >= 80 else "significant" if risk_score >= 60 else "moderate"
    return [
        ConsequenceStep(
            step_number=1,
            domain=ConsequenceDomain.ENERGY,
            consequence_en=f"Direct disruption to energy infrastructure from {title}. Production/export capacity reduced. Emergency shutdown protocols likely activated.",
            consequence_ar=f"تعطل مباشر في البنية التحتية للطاقة بسبب {title}. انخفاض في الطاقة الإنتاجية/التصديرية. تفعيل بروتوكولات الإغلاق الطارئ.",
            probability=95,
            timeframe="0-6h",
        ),
        ConsequenceStep(
            step_number=2,
            domain=ConsequenceDomain.MARKETS,
            consequence_en=f"Brent crude futures spike $6–14/bbl at next market open. Gulf energy indices drop 3–7%. Insurance premiums for {region} corridor re-rated upward.",
            consequence_ar=f"ارتفاع حاد في عقود خام برنت بمقدار ٦-١٤ دولار/برميل عند افتتاح السوق. انخفاض مؤشرات الطاقة الخليجية ٣-٧٪. إعادة تسعير أقساط التأمين لممر {region}.",
            probability=88,
            timeframe="6-24h",
        ),
        ConsequenceStep(
            step_number=3,
            domain=ConsequenceDomain.TRADE,
            consequence_en=f"Tanker diversions create {severity_word} port congestion at alternate terminals. Cargo delays of 5–10 days cascade through Asian and European supply chains.",
            consequence_ar=f"تحويل ناقلات النفط يخلق ازدحاماً {severity_word} في الموانئ البديلة. تأخيرات في الشحن ٥-١٠ أيام تتسلسل عبر سلاسل الإمداد الآسيوية والأوروبية.",
            probability=75,
            timeframe="24-72h",
        ),
        ConsequenceStep(
            step_number=4,
            domain=ConsequenceDomain.SECURITY,
            consequence_en="Regional military forces elevate readiness. Naval patrols intensified in affected corridor. Allied intelligence sharing protocols activated.",
            consequence_ar="القوات العسكرية الإقليمية ترفع جاهزيتها. تكثيف الدوريات البحرية في الممر المتأثر. تفعيل بروتوكولات تبادل الاستخبارات مع الحلفاء.",
            probability=80,
            timeframe="6-24h",
        ),
        ConsequenceStep(
            step_number=5,
            domain=ConsequenceDomain.DIPLOMATIC,
            consequence_en="UN Security Council emergency consultations likely. OPEC+ emergency meeting probable within 48h to discuss spare capacity allocation.",
            consequence_ar="مشاورات طارئة محتملة في مجلس الأمن الدولي. اجتماع طارئ لأوبك+ محتمل خلال ٤٨ ساعة لمناقشة تخصيص الطاقة الفائضة.",
            probability=60,
            timeframe="24-72h",
        ),
    ]


def _maritime_chain(title: str, region: str, risk_score: int) -> list[ConsequenceStep]:
    return [
        ConsequenceStep(
            step_number=1,
            domain=ConsequenceDomain.SECURITY,
            consequence_en=f"Naval assets reposition to secure corridor near {region}. Vessel advisories issued. SSAS activation mandated for transiting ships.",
            consequence_ar=f"إعادة تموضع الأصول البحرية لتأمين الممر قرب {region}. إصدار تحذيرات للسفن. تفعيل إلزامي لنظام SSAS للسفن العابرة.",
            probability=92,
            timeframe="0-6h",
        ),
        ConsequenceStep(
            step_number=2,
            domain=ConsequenceDomain.TRADE,
            consequence_en="Shipping companies reroute via Cape of Good Hope adding 10–14 days transit time. Container freight rates surge 25–40%. Fuel surcharges applied.",
            consequence_ar="شركات الشحن تعيد توجيه سفنها عبر رأس الرجاء الصالح مما يضيف ١٠-١٤ يوماً. ارتفاع أسعار شحن الحاويات ٢٥-٤٠٪. فرض رسوم وقود إضافية.",
            probability=85,
            timeframe="6-24h",
        ),
        ConsequenceStep(
            step_number=3,
            domain=ConsequenceDomain.MARKETS,
            consequence_en="Marine insurance war risk premiums for Red Sea/Gulf corridor spike 200–400%. Lloyd's of London re-rates entire region. Shipping company stocks drop 5–12%.",
            consequence_ar="ارتفاع أقساط تأمين مخاطر الحرب البحرية لممر البحر الأحمر/الخليج ٢٠٠-٤٠٠٪. إعادة تقييم المنطقة بالكامل من لويدز لندن. انخفاض أسهم شركات الشحن ٥-١٢٪.",
            probability=80,
            timeframe="24-72h",
        ),
        ConsequenceStep(
            step_number=4,
            domain=ConsequenceDomain.ENERGY,
            consequence_en="Oil and LNG tankers avoid corridor. Brent premium widens. Asian buyers face delivery delays. Strategic reserves drawdown discussions begin.",
            consequence_ar="ناقلات النفط والغاز المسال تتجنب الممر. اتساع علاوة خام برنت. المشترون الآسيويون يواجهون تأخيرات في التسليم. بدء مناقشات السحب من الاحتياطيات الاستراتيجية.",
            probability=72,
            timeframe="24-72h",
        ),
        ConsequenceStep(
            step_number=5,
            domain=ConsequenceDomain.HUMANITARIAN,
            consequence_en="Food and medicine shipments to Horn of Africa and Yemen delayed. WFP emergency rerouting adds cost and time. Humanitarian corridors under negotiation.",
            consequence_ar="تأخر شحنات الغذاء والدواء إلى القرن الأفريقي واليمن. إعادة توجيه طارئة من برنامج الأغذية العالمي تزيد التكلفة والوقت. ممرات إنسانية قيد التفاوض.",
            probability=65,
            timeframe="1-2w",
        ),
    ]


def _aviation_chain(title: str, region: str, risk_score: int) -> list[ConsequenceStep]:
    return [
        ConsequenceStep(
            step_number=1,
            domain=ConsequenceDomain.SECURITY,
            consequence_en=f"FIR closure in {region}. All overflights rerouted. Military ISR assets deployed for airspace monitoring. NOTAM issued immediately.",
            consequence_ar=f"إغلاق منطقة معلومات الطيران في {region}. تحويل جميع الرحلات الجوية. نشر أصول الاستطلاع العسكري لمراقبة المجال الجوي. إصدار NOTAM فوري.",
            probability=95,
            timeframe="0-6h",
        ),
        ConsequenceStep(
            step_number=2,
            domain=ConsequenceDomain.TRADE,
            consequence_en="Airlines reroute adding 60–120min to Gulf-Europe flights. Fuel costs increase $1.5–3M/week per major carrier. Air cargo capacity to Gulf reduced 15–25%.",
            consequence_ar="شركات الطيران تعيد توجيه رحلاتها مما يضيف ٦٠-١٢٠ دقيقة لرحلات الخليج-أوروبا. زيادة تكاليف الوقود ١.٥-٣ مليون دولار/أسبوع لكل ناقل رئيسي.",
            probability=88,
            timeframe="6-24h",
        ),
        ConsequenceStep(
            step_number=3,
            domain=ConsequenceDomain.MARKETS,
            consequence_en="Gulf airline stocks drop 3–8%. Aviation fuel futures rise. Tourism bookings to region decline 10–20% within 72 hours.",
            consequence_ar="انخفاض أسهم شركات الطيران الخليجية ٣-٨٪. ارتفاع عقود وقود الطيران. تراجع حجوزات السياحة للمنطقة ١٠-٢٠٪ خلال ٧٢ ساعة.",
            probability=70,
            timeframe="24-72h",
        ),
        ConsequenceStep(
            step_number=4,
            domain=ConsequenceDomain.DIPLOMATIC,
            consequence_en="ICAO emergency coordination. Bilateral airspace agreements under review. Diplomatic channels activated to negotiate FIR reopening conditions.",
            consequence_ar="تنسيق طارئ من منظمة الطيران المدني الدولي. مراجعة اتفاقيات المجال الجوي الثنائية. تفعيل القنوات الدبلوماسية للتفاوض على شروط إعادة فتح FIR.",
            probability=60,
            timeframe="24-72h",
        ),
    ]


def _cyber_chain(title: str, region: str, risk_score: int) -> list[ConsequenceStep]:
    return [
        ConsequenceStep(
            step_number=1,
            domain=ConsequenceDomain.SECURITY,
            consequence_en=f"Critical systems compromised. National CERT activated. Incident response teams deployed. Affected systems isolated pending forensic analysis.",
            consequence_ar=f"اختراق أنظمة حيوية. تفعيل فريق الاستجابة الوطني للطوارئ السيبرانية. نشر فرق الاستجابة للحوادث. عزل الأنظمة المتأثرة بانتظار التحليل الجنائي.",
            probability=95,
            timeframe="0-6h",
        ),
        ConsequenceStep(
            step_number=2,
            domain=ConsequenceDomain.ENERGY,
            consequence_en="SCADA/ICS systems in energy sector on heightened alert. Precautionary shutdowns at connected facilities. Manual override procedures activated.",
            consequence_ar="أنظمة SCADA/ICS في قطاع الطاقة في حالة تأهب قصوى. إغلاق احترازي في المنشآت المتصلة. تفعيل إجراءات التحكم اليدوي.",
            probability=75,
            timeframe="6-24h",
        ),
        ConsequenceStep(
            step_number=3,
            domain=ConsequenceDomain.MARKETS,
            consequence_en="Affected sector stocks drop 4–10%. Cybersecurity company valuations surge. Insurance claims filed. Credit rating agencies issue sector watch notices.",
            consequence_ar="انخفاض أسهم القطاع المتأثر ٤-١٠٪. ارتفاع تقييمات شركات الأمن السيبراني. تقديم مطالبات تأمينية. وكالات التصنيف تصدر إشعارات مراقبة.",
            probability=70,
            timeframe="24-72h",
        ),
        ConsequenceStep(
            step_number=4,
            domain=ConsequenceDomain.DIPLOMATIC,
            consequence_en="Attribution analysis underway. State-sponsored activity suspected. Diplomatic demarches prepared. Cyber sanctions packages under review.",
            consequence_ar="جاري تحليل الإسناد. اشتباه بنشاط مدعوم من دولة. تحضير احتجاجات دبلوماسية. مراجعة حزم العقوبات السيبرانية.",
            probability=55,
            timeframe="1-2w",
        ),
    ]


def _geopolitical_chain(title: str, region: str, risk_score: int) -> list[ConsequenceStep]:
    return [
        ConsequenceStep(
            step_number=1,
            domain=ConsequenceDomain.DIPLOMATIC,
            consequence_en=f"Diplomatic activity intensifies around {region}. Ambassadors recalled for consultations. Emergency UN sessions requested.",
            consequence_ar=f"تكثيف النشاط الدبلوماسي حول {region}. استدعاء السفراء للمشاورات. طلب جلسات طارئة في الأمم المتحدة.",
            probability=85,
            timeframe="0-6h",
        ),
        ConsequenceStep(
            step_number=2,
            domain=ConsequenceDomain.SECURITY,
            consequence_en="Military postures adjusted across region. Force protection levels elevated. Intelligence sharing between allies intensified.",
            consequence_ar="تعديل الأوضاع العسكرية عبر المنطقة. رفع مستويات حماية القوات. تكثيف تبادل الاستخبارات بين الحلفاء.",
            probability=78,
            timeframe="6-24h",
        ),
        ConsequenceStep(
            step_number=3,
            domain=ConsequenceDomain.MARKETS,
            consequence_en="Safe-haven flows into gold and USD. Regional equity markets decline 2–5%. Foreign direct investment reviews triggered. Sovereign risk spreads widen.",
            consequence_ar="تدفقات نحو الملاذات الآمنة في الذهب والدولار. تراجع أسواق الأسهم الإقليمية ٢-٥٪. مراجعة الاستثمار الأجنبي المباشر. اتساع فروقات المخاطر السيادية.",
            probability=72,
            timeframe="24-72h",
        ),
        ConsequenceStep(
            step_number=4,
            domain=ConsequenceDomain.HUMANITARIAN,
            consequence_en="Civilian displacement risk assessed. Humanitarian agencies pre-position supplies. Cross-border refugee flow contingency plans activated.",
            consequence_ar="تقييم مخاطر نزوح المدنيين. وكالات إنسانية تجهز الإمدادات مسبقاً. تفعيل خطط طوارئ تدفق اللاجئين عبر الحدود.",
            probability=50,
            timeframe="1-2w",
        ),
    ]


def _default_chain(title: str, region: str, risk_score: int) -> list[ConsequenceStep]:
    return [
        ConsequenceStep(
            step_number=1,
            domain=ConsequenceDomain.SECURITY,
            consequence_en=f"Initial assessment of {title} underway. Local authorities responding. Situation monitoring activated.",
            consequence_ar=f"جاري التقييم الأولي لـ{title}. استجابة السلطات المحلية. تفعيل مراقبة الوضع.",
            probability=90,
            timeframe="0-6h",
        ),
        ConsequenceStep(
            step_number=2,
            domain=ConsequenceDomain.TRADE,
            consequence_en=f"Potential disruption to operations in {region}. Businesses assess exposure. Contingency plans reviewed.",
            consequence_ar=f"احتمال تعطل العمليات في {region}. الشركات تقيّم مدى التعرض. مراجعة خطط الطوارئ.",
            probability=60,
            timeframe="6-24h",
        ),
        ConsequenceStep(
            step_number=3,
            domain=ConsequenceDomain.MARKETS,
            consequence_en="Market participants monitor situation. Sector-specific volatility expected if situation escalates.",
            consequence_ar="المشاركون في السوق يراقبون الوضع. تقلبات قطاعية متوقعة في حال التصعيد.",
            probability=45,
            timeframe="24-72h",
        ),
        ConsequenceStep(
            step_number=4,
            domain=ConsequenceDomain.DIPLOMATIC,
            consequence_en="Regional diplomatic channels engaged for de-escalation. International community monitoring.",
            consequence_ar="تفعيل القنوات الدبلوماسية الإقليمية لخفض التصعيد. المجتمع الدولي يراقب.",
            probability=40,
            timeframe="1-2w",
        ),
    ]


# ═══════════════════════════════════════════════════════════════════════
#  MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════

# Template routing table
_CHAIN_MAP: dict[tuple[str, str] | str, callable] = {
    (EventType.STRIKE, Sector.ENERGY):        _energy_strike_chain,
    (EventType.STRIKE, Sector.INFRASTRUCTURE): _energy_strike_chain,
    EventType.MARITIME:                        _maritime_chain,
    EventType.AVIATION:                        _aviation_chain,
    EventType.CYBER:                           _cyber_chain,
    EventType.GEOPOLITICAL:                    _geopolitical_chain,
}


def generate_consequence_chain(
    event_type: str,
    sector: str,
    title: str,
    region: str,
    risk_score: int,
) -> list[ConsequenceStep]:
    """
    Generate a consequence chain for an event using rule-based templates.
    Falls back to default chain if no specific template matches.
    """
    # Try specific (event_type, sector) match first
    chain_fn = _CHAIN_MAP.get((event_type, sector))

    # Then try event_type-only match
    if chain_fn is None:
        chain_fn = _CHAIN_MAP.get(event_type)

    # Default fallback
    if chain_fn is None:
        chain_fn = _default_chain

    return chain_fn(title, region, risk_score)
