import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Statistiche tab Agenzie, scoped per dominio.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();

  const supabase = createServiceClient();

  const base = () => {
    let q = supabase.from("agencies").select("*", { count: "exact", head: true });
    if (domainId) q = q.eq("domain_id", domainId);
    return q;
  };

  const [totale, verified, enriched, citiesRes, top10, top20, serpChecked] =
    await Promise.all([
      base(),
      base().eq("verifica", "verified"),
      base().not("last_enriched_at", "is", null),
      (() => {
        let q = supabase.from("agencies").select("citta").not("citta", "is", null);
        if (domainId) q = q.eq("domain_id", domainId);
        return q;
      })(),
      base().not("serp_position", "is", null).lte("serp_position", 10),
      base().not("serp_position", "is", null).lte("serp_position", 20),
      base().not("serp_checked_at", "is", null),
    ]);

  const uniqueCities = new Set((citiesRes.data ?? []).map((r) => r.citta as string)).size;

  return NextResponse.json({
    total: totale.count ?? 0,
    verified: verified.count ?? 0,
    enriched: enriched.count ?? 0,
    cities: uniqueCities,
    top10: top10.count ?? 0,
    top20: top20.count ?? 0,
    serp_checked: serpChecked.count ?? 0,
  });
}
