import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Ritorna i valori distinti utilizzabili dai dropdown filtri
// (regioni, città, stato verifica, status curatela, enrichment_status).
// Scoped per dominio.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();

  const supabase = createServiceClient();

  const cols = "regioni, citta, verifica, status_curatela, enrichment_status";
  let q = supabase.from("agencies").select(cols).limit(50000);
  if (domainId) q = q.eq("domain_id", domainId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<{
    regioni: string | null;
    citta: string | null;
    verifica: string | null;
    status_curatela: string | null;
    enrichment_status: string | null;
  }>;

  const uniqueSorted = (values: Array<string | null>): string[] =>
    Array.from(new Set(values.filter((v): v is string => Boolean(v && v.trim())))).sort((a, b) =>
      a.localeCompare(b, "it"),
    );

  // Mappa regione → città (dropdown città si restringe quando regione è selezionata).
  const cittaByRegione: Record<string, Set<string>> = {};
  for (const r of rows) {
    if (r.regioni && r.citta) {
      if (!cittaByRegione[r.regioni]) cittaByRegione[r.regioni] = new Set();
      cittaByRegione[r.regioni].add(r.citta);
    }
  }
  const cittaByRegioneOut: Record<string, string[]> = {};
  for (const k of Object.keys(cittaByRegione)) {
    cittaByRegioneOut[k] = Array.from(cittaByRegione[k]).sort((a, b) => a.localeCompare(b, "it"));
  }

  return NextResponse.json({
    regioni: uniqueSorted(rows.map((r) => r.regioni)),
    citta: uniqueSorted(rows.map((r) => r.citta)),
    citta_by_regione: cittaByRegioneOut,
    verifica: uniqueSorted(rows.map((r) => r.verifica)),
    status_curatela: uniqueSorted(rows.map((r) => r.status_curatela)),
    enrichment_status: uniqueSorted(rows.map((r) => r.enrichment_status)),
  });
}
