import { createServiceClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Filtri opzionali che restringono il set di record su cui l'agent opera.
// Se agencyIds è presente ha priorità su tutto. Altrimenti domainId limita a
// un tenant; senza né l'uno né l'altro l'agent lavora "globale" (attualmente
// solo domini attivi in agency-updater).
export interface AgentRunFilters {
  domainId?: string;
  agencyIds?: string[];
}

export interface AgentContext {
  runId: string;
  supabase: SupabaseClient;
  triggeredBy: "cron" | "manual" | `user:${string}`;
  filters: AgentRunFilters;
  log: (msg: string, meta?: Record<string, unknown>) => void;
}

export interface AgentResult {
  status: "success" | "error" | "partial";
  rowsProcessed: number;
  rowsSuccess: number;
  rowsError: number;
  meta?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  run: (ctx: AgentContext) => Promise<AgentResult>;
}

interface RunOptions {
  triggeredBy: AgentContext["triggeredBy"];
  filters?: AgentRunFilters;
}

export async function runAgent(agent: Agent, opts: RunOptions): Promise<AgentResult> {
  const supabase = createServiceClient();
  const startedAt = new Date();
  const logs: Array<{ ts: string; msg: string; meta?: Record<string, unknown> }> = [];
  const filters: AgentRunFilters = opts.filters ?? {};

  const { data: runRow, error: insertErr } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agent.id,
      started_at: startedAt.toISOString(),
      status: "running",
      triggered_by: opts.triggeredBy,
      domain_id: filters.domainId ?? null,
      meta: {
        filters: {
          domainId: filters.domainId ?? null,
          agencyIds: filters.agencyIds ?? null,
        },
      },
    })
    .select()
    .single();

  if (insertErr || !runRow) {
    throw new Error(`Failed to create agent_runs row: ${insertErr?.message}`);
  }

  const ctx: AgentContext = {
    runId: runRow.id as string,
    supabase,
    triggeredBy: opts.triggeredBy,
    filters,
    log: (msg, meta) => {
      logs.push({ ts: new Date().toISOString(), msg, meta });
      console.log(`[${agent.id}] ${msg}`, meta ?? "");
    },
  };

  let result: AgentResult;
  try {
    result = await agent.run(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.log(`FATAL: ${message}`, { stack: err instanceof Error ? err.stack : undefined });
    result = { status: "error", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  const completedAt = new Date();
  await supabase
    .from("agent_runs")
    .update({
      completed_at: completedAt.toISOString(),
      status: result.status,
      rows_processed: result.rowsProcessed,
      rows_success: result.rowsSuccess,
      rows_error: result.rowsError,
      duration_ms: completedAt.getTime() - startedAt.getTime(),
      log: { entries: logs },
      meta: {
        filters: {
          domainId: filters.domainId ?? null,
          agencyIds: filters.agencyIds ?? null,
        },
        ...(result.meta ?? {}),
      },
    })
    .eq("id", runRow.id);

  return result;
}
