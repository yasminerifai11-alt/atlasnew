import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    status: "ok",
    service: "atlas-command-web",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    checks: {
      claude_api: !!process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
      database: !!process.env.DATABASE_URL ? "configured" : "not_configured",
      redis: !!process.env.REDIS_URL ? "configured" : "not_configured",
    },
  };
  return NextResponse.json(checks);
}
