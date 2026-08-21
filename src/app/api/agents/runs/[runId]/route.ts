import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Dettaglio di un run: header + lista di agent_run_items con nome agenzia.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ runId: string }> },
) {
  const { runId } = await ctx.params;
  const supabase = createServiceClient();

  const [runRes, itemsRes] = await Promise.all([
    supabase
      .from("agent_runs")
      .select(
        "id, agent_id, started_at, completed_at, status, triggered_by, rows_processed, rows_success, rows_error, duration_ms, log, meta",
      )
      .eq("id", runId)
      .single(),
    supabase
      .from("agent_run_items")
      .select("id, agency_id, status, sources_hit, fields_updated, errors, duration_ms, agencies(title, citta)")
      .eq("run_id", runId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  if (runRes.error) {
    return NextResponse.json({ error: runRes.error.message }, { status: 404 });
  }

  return NextResponse.json({
    run: runRes.data,
    items: itemsRes.data ?? [],
  });
}
