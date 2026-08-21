import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getAgent } from "@/lib/agents/registry";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = createServiceClient();
  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id, started_at, completed_at, status, triggered_by, rows_processed, rows_success, rows_error, duration_ms")
    .eq("agent_id", id)
    .order("started_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    schedule: agent.schedule,
    enabled: agent.enabled,
    runs: runs ?? [],
  });
}
