import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const SYSTEM_EN = `You are Atlas Commander — the AI advisor inside Atlas Command, an intelligence platform that monitors global signals across conflict, energy, infrastructure, maritime, aviation, and cyber domains.

You have access to all active events currently being tracked. When the user asks about the situation, provide analysis based on the events data provided.

Your style:
- Operational and precise. No filler words.
- Structure responses with clear sections when appropriate.
- Always provide actionable intelligence, not just summaries.
- Reference specific events, risk scores, and infrastructure by name.
- When asked "what should I do?" — give concrete actions with timeframes.
- Think like a national security advisor briefing a head of state.`;

const SYSTEM_AR = `أنت أطلس كوماندر — المستشار الذكي في منصة أطلس كوماند، منصة استخباراتية ترصد الإشارات العالمية عبر مجالات النزاعات والطاقة والبنية التحتية والشؤون البحرية والطيران والأمن السيبراني.

لديك وصول لجميع الأحداث النشطة المتتبعة حالياً. عندما يسأل المستخدم عن الوضع، قدم تحليلاً مبنياً على بيانات الأحداث المقدمة.

قواعد صارمة للغة:
- اكتب بالعربية الفصحى الرسمية فقط
- لا تستخدم أي كلمات إنجليزية إطلاقاً في النص
- لا تكتب أسماء القطاعات بالإنجليزية
- لا تكتب أسماء المناطق بالإنجليزية

الترجمات الإلزامية:
ENERGY → الطاقة | MARITIME → البحري | SECURITY → الأمن | CYBER → الإلكتروني | MILITARY → العسكري
CRITICAL → حرج | HIGH → عالٍ | MEDIUM → متوسط | LOW → منخفض
Red Sea → البحر الأحمر | Strait of Hormuz → مضيق هرمز | Persian Gulf → الخليج العربي
Gulf of Aden → خليج عدن | Arabian Sea → بحر العرب | Indian Ocean → المحيط الهندي
Pacific → المحيط الهادئ | Mediterranean → البحر الأبيض المتوسط
NUCLEAR → نووي | AVIATION → جوي | FINANCIAL → مالي | INFRASTRUCTURE → بنية تحتية
DIPLOMATIC → دبلوماسي | GEOPOLITICAL → جيوسياسي | SANCTIONS → عقوبات

الاستثناءات المسموح بها فقط:
- "أطلس كوماند" (اسم المنصة)
- "atlascommand.ai" (النطاق)
- أسماء المصادر كـ BBC وReuters (علامات تجارية فقط)
- الأرقام والنسب المئوية

أسلوبك:
- كما لو كنت تقدم إحاطة لوزير أو قائد عسكري
- عملياتي ودقيق. بدون حشو.
- هيكل الإجابات بأقسام واضحة عند الحاجة.
- قدم دائماً استخبارات قابلة للتنفيذ، وليس مجرد ملخصات.
- أشر للأحداث المحددة ودرجات الخطر والبنية التحتية بالاسم العربي.
- عندما يُسأل "ماذا يجب أن أفعل؟" — قدم إجراءات محددة بأطر زمنية.
- فكر كمستشار أمن وطني يقدم إحاطة لرئيس دولة.`;

interface ProfileContext {
  role: string;
  region: string;
  watchlist?: string;
}

function buildProfileContext(profile: ProfileContext, lang: string): string {
  if (lang === "ar") {
    return `\n\n--- ملف المستخدم ---\nأنت تقدم المشورة لمتخصص في ${profile.role} يركز على ${profile.region}.${profile.watchlist ? ` اهتماماتهم المحددة: ${profile.watchlist}.` : ""}\nصمم جميع الردود لسياق قراراتهم. أجب بالعربية.`;
  }
  return `\n\n--- USER PROFILE ---\nYou are advising a ${profile.role} professional focused on ${profile.region}.${profile.watchlist ? ` Their specific interests: ${profile.watchlist}.` : ""}\nTailor all responses to their decision context. Respond in English.`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, events, lang, profile } = await req.json();

    const isAr = lang === "ar";
    const SECTOR_AR_MAP: Record<string, string> = {
      ENERGY: "الطاقة", MARITIME: "البحري", SECURITY: "الأمن", CYBER: "الإلكتروني",
      MILITARY: "العسكري", NUCLEAR: "نووي", AVIATION: "جوي", FINANCIAL: "مالي",
      INFRASTRUCTURE: "بنية تحتية", DIPLOMATIC: "دبلوماسي", GEOPOLITICAL: "جيوسياسي",
      TRADE: "تجارة", HUMANITARIAN: "إنساني", TERRORISM: "إرهاب",
    };
    const REGION_AR_MAP: Record<string, string> = {
      "Red Sea": "البحر الأحمر", "Persian Gulf": "الخليج العربي", "Arabian Gulf": "الخليج العربي",
      "Strait of Hormuz": "مضيق هرمز", "Gulf of Aden": "خليج عدن", "Bab el-Mandeb": "باب المندب",
      "Eastern Mediterranean": "شرق المتوسط", "Levant": "الشام", "Horn of Africa": "القرن الأفريقي",
      "Central Asia": "آسيا الوسطى", "South Asia": "جنوب آسيا", "North Africa": "شمال أفريقيا", "GCC": "دول الخليج",
    };
    const RISK_AR_MAP: Record<string, string> = {
      CRITICAL: "حرج", HIGH: "عالٍ", MEDIUM: "متوسط", LOW: "منخفض",
    };
    const trSector = (s: string) => isAr ? (SECTOR_AR_MAP[s] || s) : s;
    const trRegion = (r: string) => isAr ? (REGION_AR_MAP[r] || r) : r;
    const trRisk = (r: string) => isAr ? (RISK_AR_MAP[r] || r) : r;

    const eventsContext = events
      ?.slice(0, 10)
      .map(
        (e: any) =>
          `[${trRisk(e.risk_level)}] ${isAr ? e.title_ar || e.title : e.title} — ${trRegion(e.region)} (${isAr ? "خطر" : "Risk"}: ${e.risk_score}/100, ${isAr ? "قطاع" : "Sector"}: ${trSector(e.sector)})\n  ${isAr ? "الوضع" : "Situation"}: ${isAr ? (e.situation_ar || e.situation_en || e.description) : (e.situation_en || e.description)}`
      )
      .join("\n\n");

    let systemPrompt = `${lang === "ar" ? SYSTEM_AR : SYSTEM_EN}\n\n--- ACTIVE EVENTS ---\n${eventsContext || "No events loaded."}`;

    // Inject profile context if available
    if (profile?.role && profile?.region) {
      systemPrompt += buildProfileContext(profile, lang);
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Chat failed" },
      { status: 500 }
    );
  }
}
