import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { resolveItalianAddress } from "@/lib/agents/agency-updater/sources/geo-resolver";

export const runtime = "nodejs";
export const maxDuration = 300;

// Backfill one-shot: riparsa google_indirizzo (fallback indirizzo_completo)
// per ogni agenzia del dominio e riscrive citta/regioni/aree con il formato
// nuovo (citta = provincia). Idempotente: aggiorna solo se il parse produce
// valori diversi da quelli attuali.
//
// POST /api/agencies/backfill-geo?domain_id=<uuid>
// Auth: Bearer JWT, role owner|dev.
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

export async function POST(req: NextRequest) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const domainId = new URL(req.url).searchParams.get("domain_id")?.trim();
  if (!domainId) return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });

  const PAGE = 1000;
  const rows: Array<{
    id: string;
    citta: string | null;
    regioni: string | null;
    aree: string | null;
    google_indirizzo: string | null;
    indirizzo_completo: string | null;
  }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await auth.supabase
      .from("agencies")
      .select("id, citta, regioni, aree, google_indirizzo, indirizzo_completo")
      .eq("domain_id", domainId)
      .neq("publish_status", "trash")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    rows.push(...(data as typeof rows));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  let updated = 0;
  let unchanged = 0;
  let noAddress = 0;
  let notParsed = 0;

  for (const r of rows) {
    const source = r.google_indirizzo ?? r.indirizzo_completo ?? null;
    if (!source) {
      noAddress++;
      continue;
    }
    const geo = resolveItalianAddress(source);
    if (!geo) {
      notParsed++;
      continue;
    }
    if (r.citta === geo.citta_slug && r.regioni === geo.regioni_slug && r.aree === geo.aree) {
      unchanged++;
      continue;
    }
    const { error: updErr } = await auth.supabase
      .from("agencies")
      .update({
        citta: geo.citta_slug,
        regioni: geo.regioni_slug,
        aree: geo.aree,
      })
      .eq("id", r.id);
    if (updErr) continue;
    updated++;
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    updated,
    unchanged,
    no_address: noAddress,
    not_parsed: notParsed,
  });
}
