import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const PAGE_SIZE = 25;

// Lista agenzie paginata + filtri.
// Query params:
//   page (default 1)
//   q (search su title)
//   citta
//   verifica
//   status_curatela
//   enriched (yes|no)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const q = url.searchParams.get("q")?.trim();
  const citta = url.searchParams.get("citta")?.trim();
  const verifica = url.searchParams.get("verifica")?.trim();
  const statusCuratela = url.searchParams.get("status_curatela")?.trim();
  const enriched = url.searchParams.get("enriched");
  const domainId = url.searchParams.get("domain_id")?.trim();

  const supabase = createServiceClient();

  let query = supabase
    .from("agencies")
    .select(
      "id, wp_id, title, citta, regioni, verifica, status_curatela, google_rating, google_recensioni_count, match_confidence, last_enriched_at",
      { count: "exact" },
    )
    .order("wp_id", { ascending: true, nullsFirst: false });

  if (domainId) query = query.eq("domain_id", domainId);
  if (q) query = query.ilike("title", `%${q}%`);
  if (citta) query = query.eq("citta", citta);
  if (verifica) query = query.eq("verifica", verifica);
  if (statusCuratela) query = query.eq("status_curatela", statusCuratela);
  if (enriched === "yes") query = query.not("last_enriched_at", "is", null);
  if (enriched === "no") query = query.is("last_enriched_at", null);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
}
