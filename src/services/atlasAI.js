const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

export async function generateBrief(event) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("API key not configured. Set VITE_ANTHROPIC_API_KEY in your .env file.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are Atlas Command — an AI planetary decision intelligence system used by senior government and corporate leaders. Write a classified intelligence brief for this event. Be direct, analytical, and operational. No fluff.

Event: ${event.title}
Region: ${event.region}
Sector: ${event.sector}
Risk Level: ${event.risk_level} (Score: ${event.risk_score})
Source Confidence: ${event.confidence}%
Details: ${event.what_is_happening}

Format your response as:
SITUATION ASSESSMENT: (2 sentences max — what is confirmed)
STRATEGIC SIGNIFICANCE: (why it matters geopolitically or economically)
PROBABILITY ASSESSMENT: (what comes next, with confidence percentages)
COMMAND RECOMMENDATION: (3 numbered actions for senior leadership, direct and specific)

Keep it tight. This is for a decision-maker with 90 seconds.`
      }]
    })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Empty response from Atlas AI");
  return text;
}
