import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// GET /api/agency-issues — lista issues aperte + join agency title/citta.
// Query params:
//   domain_id (obbligatorio: filtra sulle agenzie del dominio)
//   type (opz): filtra per tipo issue
//   severity (opz): filtra per severity
//   status (opz): 'open' (default) | 'resolved' | 'all'
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();
  const type = url.searchParams.get("type")?.trim();
  const severity = url.searchParams.get("severity")?.trim();
  const status = url.searchParams.get("status")?.trim() || "open";

  if (!domainId) {
    return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("agency_issues")
    .select(
      "id, agency_id, type, severity, evidence, detected_at, last_seen_at, resolved_at, resolution, resolved_by, notes, agencies!inner(title, citta, sito_web, domain_id)",
    )
    .eq("agencies.domain_id", domainId)
    .order("severity", { ascending: false })
    .order("detected_at", { ascending: false });

  if (status === "open") query = query.is("resolved_at", null);
  else if (status === "resolved") query = query.not("resolved_at", "is", null);
  if (type) query = query.eq("type", type);
  if (severity) query = query.eq("severity", severity);

  const { data, error } = await query.limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}
