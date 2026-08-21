import { createServiceClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AgentContext {
  runId: string;
  supabase: SupabaseClient;
  triggeredBy: "cron" | "manual" | `user:${string}`;
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
  id: string;                 // stable slug, es 'agency-updater'
  name: string;               // human-readable
  description: string;
  schedule: string;           // cron expression, es '0 3 * * *'
  enabled: boolean;
  run: (ctx: AgentContext) => Promise<AgentResult>;
}

interface RunOptions {
  triggeredBy: AgentContext["triggeredBy"];
}

// Esegue un agente creando riga in agent_runs, gestisce success/error, chiude riga.
export async function runAgent(agent: Agent, opts: RunOptions): Promise<AgentResult> {
  const supabase = createServiceClient();
  const startedAt = new Date();
  const logs: Array<{ ts: string; msg: string; meta?: Record<string, unknown> }> = [];

  const { data: runRow, error: insertErr } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agent.id,
      started_at: startedAt.toISOString(),
      status: "running",
      triggered_by: opts.triggeredBy,
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
      meta: result.meta ?? null,
    })
    .eq("id", runRow.id);

  return result;
}
