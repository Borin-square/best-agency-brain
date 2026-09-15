import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getAgent } from "@/lib/agents/registry";

async function requireOwnerOrDev(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return { error: "unauthorized" as const, status: 401 as const };
  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) return { error: "invalid_token" as const, status: 401 as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "owner" && profile.role !== "dev")) {
    return { error: "forbidden" as const, status: 403 as const };
  }
  return { supabase };
}

// GET /api/agent-schedules/[id] — config schedule dell'agente
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "agent_not_found" }, { status: 404 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_schedules")
    .select("agent_id, interval_minutes, enabled, last_run_at, last_dispatched_at, updated_at")
    .eq("agent_id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/agent-schedules/[id] — modifica intervallo o enabled
// Body: { interval_minutes?: number, enabled?: boolean }
// Auth: owner|dev
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "agent_not_found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    interval_minutes?: number;
    enabled?: boolean;
  } | null;

  if (!body || (body.interval_minutes === undefined && body.enabled === undefined)) {
    return NextResponse.json({ error: "no_fields_to_update" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.interval_minutes !== undefined) {
    const iv = Math.trunc(body.interval_minutes);
    if (!Number.isFinite(iv) || iv < 1 || iv > 43200) {
      return NextResponse.json(
        { error: "invalid_interval", hint: "1..43200 minutes" },
        { status: 400 },
      );
    }
    update.interval_minutes = iv;
  }
  if (body.enabled !== undefined) update.enabled = !!body.enabled;

  // Upsert: se la riga non esiste (agente registrato dopo la migration seed)
  // la creiamo con i valori richiesti.
  const { data, error } = await auth.supabase
    .from("agent_schedules")
    .upsert({ agent_id: id, ...update }, { onConflict: "agent_id" })
    .select("agent_id, interval_minutes, enabled, last_run_at, last_dispatched_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
