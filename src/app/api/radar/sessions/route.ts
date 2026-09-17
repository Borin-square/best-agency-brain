import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// GET /api/radar/sessions?domain_id=&matched_only=&days=&q=
// Lista sessioni ordinate per last_seen_at desc con opzionale filtro:
//  - matched_only=1: solo quelle con matched_agency_id
//  - days=7: solo ultime N giorni (default 30)
//  - q=: cerca su company_name/org/reverse_dns
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();
  const matchedOnly = url.searchParams.get("matched_only") === "1";
  const days = Math.max(1, Math.min(365, parseInt(url.searchParams.get("days") ?? "30", 10)));
  const q = url.searchParams.get("q")?.trim();

  const supabase = createServiceClient();

  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("radar_sessions")
    .select(
      "session_key, domain_id, ip, ip_truncated, day, first_seen_at, last_seen_at, pageviews_count, user_agent, country, city, enriched_at, enrich_error, company_name, company_domain, org, asn, reverse_dns, matched_agency_id, match_score, match_reason, agencies!radar_sessions_matched_agency_id_fkey(id, title, sito_web, citta)",
    )
    .gte("last_seen_at", sinceIso)
    .order("last_seen_at", { ascending: false })
    .limit(500);

  if (domainId) query = query.eq("domain_id", domainId);
  if (matchedOnly) query = query.not("matched_agency_id", "is", null);
  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `company_name.ilike.${like},org.ilike.${like},reverse_dns.ilike.${like},company_domain.ilike.${like}`,
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: data ?? [] });
}
