import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { listAgents } from "@/lib/agents/registry";

// Lista agenti + ultimo run per la dashboard.
export async function GET() {
  const supabase = createServiceClient();
  const agents = listAgents();

  const results = await Promise.all(
    agents.map(async (a) => {
      const { data: lastRun } = await supabase
        .from("agent_runs")
        .select("status, completed_at, rows_processed")
        .eq("agent_id", a.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: a.id,
        name: a.name,
        description: a.description,
        schedule: a.schedule,
        enabled: a.enabled,
        last_run: lastRun ?? null,
      };
    }),
  );

  return NextResponse.json({ agents: results });
}
