import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

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
  return { supabase, userId: userData.user.id };
}

// PATCH /api/agency-issues/[id] — risolvi una issue.
// Body: { action: 'trash'|'ignore'|'fixed', notes?: string }
//   - 'trash': soft-delete agency (publish_status='trash') + resolve issue
//   - 'ignore': marca issue come 'ignored' senza toccare l'agency
//   - 'fixed': marca issue come 'fixed' (evidence rimossa manualmente)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    action?: "trash" | "ignore" | "fixed";
    notes?: string;
  } | null;

  if (!body?.action) {
    return NextResponse.json({ error: "missing_action" }, { status: 400 });
  }

  // Fetch issue per capire l'agency_id (serve per trash)
  const { data: issue, error: fetchErr } = await auth.supabase
    .from("agency_issues")
    .select("agency_id, type, resolved_at")
    .eq("id", id)
    .single();
  if (fetchErr || !issue) {
    return NextResponse.json({ error: "issue_not_found" }, { status: 404 });
  }
  if (issue.resolved_at) {
    return NextResponse.json({ error: "already_resolved" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Trash: soft-delete agency + close issue
  if (body.action === "trash") {
    const { error: agErr } = await auth.supabase
      .from("agencies")
      .update({
        publish_status: "trash",
        note_curatore: `Trashed via quality review (issue ${issue.type})${body.notes ? " — " + body.notes : ""}`,
      })
      .eq("id", issue.agency_id);
    if (agErr) return NextResponse.json({ error: agErr.message }, { status: 500 });

    // Chiudi TUTTE le issue aperte per questa agency (l'agenzia non esiste più operativamente)
    const { error: issueErr } = await auth.supabase
      .from("agency_issues")
      .update({
        resolved_at: now,
        resolution: "trashed",
        resolved_by: auth.userId,
        notes: body.notes ?? null,
      })
      .eq("agency_id", issue.agency_id)
      .is("resolved_at", null);
    if (issueErr) return NextResponse.json({ error: issueErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, action: "trash", agency_id: issue.agency_id });
  }

  // Ignore o Fixed: solo chiude la singola issue
  const resolution = body.action === "ignore" ? "ignored" : "fixed";
  const { error: updErr } = await auth.supabase
    .from("agency_issues")
    .update({
      resolved_at: now,
      resolution,
      resolved_by: auth.userId,
      notes: body.notes ?? null,
    })
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, action: body.action });
}
