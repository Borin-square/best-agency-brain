import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getAgent } from "@/lib/agents/registry";
import { runAgent } from "@/lib/agents/framework";

export const runtime = "nodejs";
export const maxDuration = 300; // Hobby plan max — se il batch di 30 non basta, ridurre BATCH_SIZE in run.ts

// Trigger manuale da dashboard.
// Autenticato via Supabase JWT (Bearer token dall'utente loggato).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  // Verifica ruolo owner/dev
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

  const result = await runAgent(agent, { triggeredBy: `user:${userData.user.id}` });
  return NextResponse.json({ ok: true, ...result });
}
