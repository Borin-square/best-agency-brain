import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getAgent } from "@/lib/agents/registry";
import { runAgent, type AgentRunFilters } from "@/lib/agents/framework";

export const runtime = "nodejs";
export const maxDuration = 300;

// Trigger manuale.
// Body opzionale: { domain_id?: string, agency_ids?: string[] }
//   - agency_ids ha priorità (esegue solo su quelle)
//   - domain_id limita al dominio
//   - vuoto → globale (solo domini attivi, come cron)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "owner" && profile.role !== "dev")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "agent_not_found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    domain_id?: string;
    agency_ids?: string[];
  } | null;

  const filters: AgentRunFilters = {};
  if (body?.domain_id) filters.domainId = body.domain_id;
  if (Array.isArray(body?.agency_ids) && body!.agency_ids!.length > 0) {
    filters.agencyIds = body!.agency_ids!;
  }

  const result = await runAgent(agent, {
    triggeredBy: `user:${userData.user.id}`,
    filters,
  });
  return NextResponse.json({ ok: true, ...result });
}
