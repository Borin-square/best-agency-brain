import { NextResponse, after, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getAgent } from "@/lib/agents/registry";
import { runAgent } from "@/lib/agents/framework";

export const runtime = "nodejs";
export const maxDuration = 300; // in-process: la function resta viva finché gli agenti finiscono

// Cron master: chiamato ogni minuto da Vercel Cron.
// Legge agent_schedules, triggera in-process (via after()) gli agenti dovuti.
// Ogni agent gira in parallelo con Promise.allSettled dentro after(): la
// response al cron caller esce subito, la function resta viva fino al max
// duration per completare i runAgent().
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: schedules, error } = await supabase
    .from("agent_schedules")
    .select(
      "agent_id, interval_minutes, enabled, domain_id, refresh_days, batch_size, last_run_at, last_dispatched_at",
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const nowMs = now.getTime();
  const toRun: Array<{
    agent_id: string;
    domain_id: string | null;
    refresh_days: number | null;
    batch_size: number | null;
  }> = [];

  for (const s of schedules ?? []) {
    if (!s.enabled) continue;
    if (!getAgent(s.agent_id)) continue; // agente rimosso dal registry
    const lastMs = s.last_run_at ? new Date(s.last_run_at).getTime() : 0;
    const dispatchedMs = s.last_dispatched_at ? new Date(s.last_dispatched_at).getTime() : 0;
    // usa il più recente tra last_run_at e last_dispatched_at per evitare
    // di rilanciare mentre il precedente sta ancora girando
    const lastActivityMs = Math.max(lastMs, dispatchedMs);
    const elapsedMin = (nowMs - lastActivityMs) / 60000;
    if (elapsedMin >= s.interval_minutes) {
      toRun.push({
        agent_id: s.agent_id,
        domain_id: s.domain_id ?? null,
        refresh_days: s.refresh_days ?? null,
        batch_size: s.batch_size ?? null,
      });
    }
  }

  if (toRun.length === 0) {
    return NextResponse.json({ dispatched: [], skipped_reason: "no_schedule_due" });
  }

  // Lock ottimistico: aggiorno last_dispatched_at subito così se il prossimo
  // minuto il dispatcher rigira non ritriggera gli stessi.
  await supabase
    .from("agent_schedules")
    .update({ last_dispatched_at: now.toISOString() })
    .in(
      "agent_id",
      toRun.map((r) => r.agent_id),
    );

  // Esecuzione in-process degli agenti via after(): la response torna subito
  // al cron caller (Vercel Cron/curl), ma la function resta viva fino al
  // max duration (300s) mentre runAgent() completa.
  after(async () => {
    await Promise.allSettled(
      toRun.map(async (r) => {
        const agent = getAgent(r.agent_id);
        if (!agent) return;
        try {
          await runAgent(agent, {
            triggeredBy: "cron",
            filters: r.domain_id ? { domainId: r.domain_id } : {},
            overrides: {
              refreshDays: r.refresh_days ?? undefined,
              batchSize: r.batch_size ?? undefined,
            },
          });
          // Aggiorna last_run_at a fine esecuzione (analogo a
          // /api/cron/agents/[id] che diventa così endpoint accessorio per
          // trigger manuali via URL).
          const sb = createServiceClient();
          await sb
            .from("agent_schedules")
            .update({ last_run_at: new Date().toISOString() })
            .eq("agent_id", r.agent_id);
        } catch (e) {
          console.error(`[dispatch] runAgent ${r.agent_id} failed:`, e);
        }
      }),
    );
  });

  return NextResponse.json({
    dispatched: toRun,
    at: now.toISOString(),
  });
}
