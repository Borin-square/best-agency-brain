import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// GET /api/features/candidates?domain_id=X&area_type=regione|citta&area_slug=Y&skill=Z&q=nome
// Lista agenzie del dominio NON ancora featured in questa combo.
// Selezione LIBERA (nessun filtro su skill/area dell'agenzia): il curatore
// può featurare chiunque. Filtro testo opzionale sul title.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();
  const areaType = url.searchParams.get("area_type")?.trim();
  const areaSlug = url.searchParams.get("area_slug")?.trim();
  const skill = url.searchParams.get("skill")?.trim();
  const q = url.searchParams.get("q")?.trim();
  if (!domainId || !areaType || !areaSlug || !skill) {
    return NextResponse.json(
      { error: "missing_params", required: ["domain_id", "area_type", "area_slug", "skill"] },
      { status: 400 },
    );
  }
  if (areaType !== "regione" && areaType !== "citta") {
    return NextResponse.json({ error: "invalid_area_type" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Agenzie già featured in questa combo (per exclude list)
  const { data: featured, error: fErr } = await supabase
    .from("agency_features")
    .select("agency_id")
    .eq("area_type", areaType)
    .eq("area_slug", areaSlug)
    .eq("skill_slug", skill);
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });
  const excludeIds = new Set((featured ?? []).map((r) => r.agency_id as string));

  let query = supabase
    .from("agencies")
    .select("id, title, citta, regioni, verifica")
    .eq("domain_id", domainId)
    .neq("publish_status", "trash")
    .order("title", { ascending: true })
    .limit(100);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).filter((a) => !excludeIds.has(a.id as string));
  return NextResponse.json({ rows });
}
