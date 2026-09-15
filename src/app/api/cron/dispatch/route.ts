import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getAgent } from "@/lib/agents/registry";

export const runtime = "nodejs";
export const maxDuration = 10; // dispatcher leggero: legge config e triggera via HTTP fire-and-forget

// Cron master: chiamato ogni minuto da Vercel Cron.
// Legge agent_schedules e triggera gli agenti per cui è passato il tempo
// di intervallo dall'ultimo run.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: schedules, error } = await supabase
    .from("agent_schedules")
    .select("agent_id, interval_minutes, enabled, domain_id, last_run_at, last_dispatched_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const nowMs = now.getTime();
  const toRun: Array<{ agent_id: string; domain_id: string | null }> = [];

  for (const s of schedules ?? []) {
    if (!s.enabled) continue;
    if (!getAgent(s.agent_id)) continue; // agente rimosso dal registry
    const lastMs = s.last_run_at ? new Date(s.last_run_at).getTime() : 0;
    const dispatchedMs = s.last_dispatched_at ? new Date(s.last_dispatched_at).getTime() : 0;
    // usa il più recente tra last_run_at e last_dispatched_at per evitare
    // di rilanciare mentre il precedente sta ancora girando in background
    const lastActivityMs = Math.max(lastMs, dispatchedMs);
    const elapsedMin = (nowMs - lastActivityMs) / 60000;
    if (elapsedMin >= s.interval_minutes) {
      toRun.push({ agent_id: s.agent_id, domain_id: s.domain_id ?? null });
    }
  }

  if (toRun.length === 0) {
    return NextResponse.json({ dispatched: [], skipped_reason: "no_schedule_due" });
  }

  // Lock ottimistico: aggiorno last_dispatched_at prima di lanciare la fetch
  // così se il prossimo minuto il dispatcher rigira, non ritriggera gli stessi.
  await supabase
    .from("agent_schedules")
    .update({ last_dispatched_at: now.toISOString() })
    .in(
      "agent_id",
      toRun.map((r) => r.agent_id),
    );

  // Fire-and-forget: chiama /api/cron/agents/[id]?domain_id=... senza attendere.
  // Ogni chiamata istanzia una function separata con maxDuration=300s.
  const origin = new URL(req.url).origin;
  const dispatched: Array<{ agent_id: string; domain_id: string | null }> = [];
  for (const r of toRun) {
    const url = r.domain_id
      ? `${origin}/api/cron/agents/${r.agent_id}?domain_id=${encodeURIComponent(r.domain_id)}`
      : `${origin}/api/cron/agents/${r.agent_id}`;
    void fetch(url, {
      method: "GET",
      headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
    }).catch(() => {
      // swallow: se la fetch fallisce, il run sarà retentato al prossimo dispatch
    });
    dispatched.push({ agent_id: r.agent_id, domain_id: r.domain_id });
  }

  return NextResponse.json({ dispatched, at: now.toISOString() });
}
