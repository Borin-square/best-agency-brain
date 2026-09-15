import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { listAgents } from "@/lib/agents/registry";

// Lista agenti + ultimo run per la dashboard.
export async function GET() {
  const supabase = createServiceClient();
  const agents = listAgents();

  const results = await Promise.all(
    agents.map(async (a) => {
      const [lastRunRes, schedRes] = await Promise.all([
        supabase
          .from("agent_runs")
          .select("status, completed_at, rows_processed")
          .eq("agent_id", a.id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("agent_schedules")
          .select("interval_minutes, enabled, last_run_at")
          .eq("agent_id", a.id)
          .maybeSingle(),
      ]);

      return {
        id: a.id,
        name: a.name,
        description: a.description,
        schedule: a.schedule, // legacy hint
        enabled: a.enabled,
        last_run: lastRunRes.data ?? null,
        schedule_config: schedRes.data ?? null,
      };
    }),
  );

  return NextResponse.json({ agents: results });
}
