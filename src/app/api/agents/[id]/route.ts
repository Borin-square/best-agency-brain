import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getAgent } from "@/lib/agents/registry";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = createServiceClient();
  const [runsRes, schedRes] = await Promise.all([
    supabase
      .from("agent_runs")
      .select(
        "id, started_at, completed_at, status, triggered_by, rows_processed, rows_success, rows_error, duration_ms, domain_id, network_domains(domain, country_code)",
      )
      .eq("agent_id", id)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("agent_schedules")
      .select("interval_minutes, enabled, last_run_at, last_dispatched_at")
      .eq("agent_id", id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    schedule: agent.schedule, // legacy hint, non è più source of truth
    enabled: agent.enabled,
    runs: runsRes.data ?? [],
    schedule_config: schedRes.data ?? null,
  });
}
