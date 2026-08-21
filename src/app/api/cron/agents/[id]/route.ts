import { NextResponse, type NextRequest } from "next/server";
import { getAgent } from "@/lib/agents/registry";
import { runAgent } from "@/lib/agents/framework";

export const runtime = "nodejs";
export const maxDuration = 600;

// Cron endpoint chiamato da Vercel Cron.
// Autenticato via header Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "agent_not_found" }, { status: 404 });
  if (!agent.enabled) return NextResponse.json({ status: "disabled" });

  const result = await runAgent(agent, { triggeredBy: "cron" });
  return NextResponse.json({ ok: true, ...result });
}
