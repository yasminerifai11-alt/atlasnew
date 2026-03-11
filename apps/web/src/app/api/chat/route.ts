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

أسلوبك:
- عملياتي ودقيق. بدون حشو.
- هيكل الإجابات بأقسام واضحة عند الحاجة.
- قدم دائماً استخبارات قابلة للتنفيذ، وليس مجرد ملخصات.
- أشر للأحداث المحددة ودرجات الخطر والبنية التحتية بالاسم.
- عندما يُسأل "ماذا يجب أن أفعل؟" — قدم إجراءات محددة بأطر زمنية.
- فكر كمستشار أمن وطني يقدم إحاطة لرئيس دولة.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, events, lang } = await req.json();

    const eventsContext = events
      ?.slice(0, 10)
      .map(
        (e: any) =>
          `[${e.risk_level}] ${e.title} — ${e.region} (Risk: ${e.risk_score}/100, Sector: ${e.sector})\n  Situation: ${e.situation_en || e.description}`
      )
      .join("\n\n");

    const systemPrompt = `${lang === "ar" ? SYSTEM_AR : SYSTEM_EN}\n\n--- ACTIVE EVENTS ---\n${eventsContext || "No events loaded."}`;

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
