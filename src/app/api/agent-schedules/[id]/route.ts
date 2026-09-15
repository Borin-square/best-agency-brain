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

const SELECT_COLUMNS =
  "agent_id, interval_minutes, enabled, domain_id, last_run_at, last_dispatched_at, updated_at";

// GET /api/agent-schedules/[id] — config schedule dell'agente
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "agent_not_found" }, { status: 404 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_schedules")
    .select(SELECT_COLUMNS)
    .eq("agent_id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/agent-schedules/[id] — modifica intervallo, enabled o dominio
// Body: { interval_minutes?: number, enabled?: boolean, domain_id?: string | null }
//   - domain_id null → globale (tutti i domini attivi)
//   - domain_id UUID → limita l'esecuzione a quel dominio
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
    domain_id?: string | null;
  } | null;

  if (
    !body ||
    (body.interval_minutes === undefined &&
      body.enabled === undefined &&
      body.domain_id === undefined)
  ) {
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
  if (body.domain_id !== undefined) {
    // null esplicito → globale. Stringa → deve essere UUID valido.
    if (body.domain_id === null) update.domain_id = null;
    else if (typeof body.domain_id === "string" && body.domain_id.trim().length > 0) {
      update.domain_id = body.domain_id;
    } else {
      return NextResponse.json({ error: "invalid_domain_id" }, { status: 400 });
    }
  }

  const { data, error } = await auth.supabase
    .from("agent_schedules")
    .upsert({ agent_id: id, ...update }, { onConflict: "agent_id" })
    .select(SELECT_COLUMNS)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
