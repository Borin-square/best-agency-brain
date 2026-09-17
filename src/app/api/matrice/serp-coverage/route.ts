import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Coverage matrice SERP: per ogni cella (area × skill) ritorna la posizione
// miglioreagenzia.it in Google (dal matrice_serp_positions).
//
// Ritorna anche il conteggio agenzie per cella (dalle agencies) per rendere
// coerente l'ordine delle aree con la matrice agenzie e mostrare
// contestualmente quante agenzie compongono la SERP concorrenziale.
export async function GET(req: NextRequest) {
  const domainId = new URL(req.url).searchParams.get("domain_id")?.trim();
  if (!domainId) {
    return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: dom, error: domErr } = await supabase
    .from("network_domains")
    .select("id, starred_areas")
    .eq("id", domainId)
    .single();
  if (domErr || !dom) {
    return NextResponse.json({ error: domErr?.message ?? "domain_not_found" }, { status: 404 });
  }

  const { data: skillRows, error: skErr } = await supabase
    .from("agency_skills")
    .select("slug, label, sort_order, query_modifier")
    .eq("domain_id", domainId)
    .order("sort_order", { ascending: true });
  if (skErr) return NextResponse.json({ error: skErr.message }, { status: 500 });
  const skills = (skillRows ?? []) as Array<{
    slug: string;
    label: string;
    sort_order: number;
    query_modifier: string;
  }>;

  const PAGE = 1000;
  const rows: Array<{
    citta: string | null;
    regioni: string | null;
    competenze_core: string[] | null;
    competenze_principali: string[] | null;
    altre_competenze: string[] | null;
  }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("agencies")
      .select("citta, regioni, competenze_core, competenze_principali, altre_competenze")
      .eq("domain_id", domainId)
      .neq("publish_status", "trash")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    rows.push(...(data as typeof rows));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const skillSlugs = new Set(skills.map((s) => s.slug));

  // count agenzie per (area, skill) — stesso pattern di /api/matrice/coverage
  const agencyMatrix: Record<string, Record<string, number>> = {};
  const areaTotal: Record<string, number> = {};
  const areaSlugToLabel: Record<
    string,
    { type: "regione" | "citta"; slug: string; label: string }
  > = {};

  const capitalize = (s: string) =>
    s
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");

  for (const r of rows) {
    const skillsUnion = new Set<string>();
    for (const arr of [r.competenze_core, r.competenze_principali, r.altre_competenze]) {
      if (Array.isArray(arr)) for (const s of arr) if (skillSlugs.has(s)) skillsUnion.add(s);
    }

    const areaKeys: string[] = [];
    if (r.regioni) {
      const key = `regione:${r.regioni}`;
      areaKeys.push(key);
      if (!areaSlugToLabel[key]) {
        areaSlugToLabel[key] = { type: "regione", slug: r.regioni, label: capitalize(r.regioni) };
      }
    }
    if (r.citta) {
      const key = `citta:${r.citta}`;
      areaKeys.push(key);
      if (!areaSlugToLabel[key]) {
        areaSlugToLabel[key] = { type: "citta", slug: r.citta, label: capitalize(r.citta) };
      }
    }

    for (const areaKey of areaKeys) {
      areaTotal[areaKey] = (areaTotal[areaKey] ?? 0) + 1;
      if (!agencyMatrix[areaKey]) agencyMatrix[areaKey] = {};
      for (const skill of skillsUnion) {
        agencyMatrix[areaKey][skill] = (agencyMatrix[areaKey][skill] ?? 0) + 1;
      }
    }
  }

  // Ordinamento aree identico a /matrice/coverage
  const starredRaw = Array.isArray(dom.starred_areas)
    ? (dom.starred_areas as Array<{ type: string; slug: string }>)
    : [];
  const starredKeys: string[] = starredRaw
    .filter((s) => s && (s.type === "regione" || s.type === "citta") && typeof s.slug === "string")
    .map((s) => `${s.type}:${s.slug}`);
  const starredSet = new Set(starredKeys);

  for (const key of starredKeys) {
    if (!areaSlugToLabel[key]) {
      const [type, slug] = key.split(":");
      areaSlugToLabel[key] = { type: type as "regione" | "citta", slug, label: capitalize(slug) };
      areaTotal[key] = areaTotal[key] ?? 0;
    }
  }

  const nonStarred = Object.keys(areaSlugToLabel).filter((k) => !starredSet.has(k));
  nonStarred.sort((a, b) => {
    const dc = (areaTotal[b] ?? 0) - (areaTotal[a] ?? 0);
    if (dc !== 0) return dc;
    return areaSlugToLabel[a].label.localeCompare(areaSlugToLabel[b].label, "it");
  });

  const areasOrdered = [
    ...starredKeys.filter((k) => areaSlugToLabel[k]),
    ...nonStarred,
  ].map((key) => ({
    key,
    type: areaSlugToLabel[key].type,
    slug: areaSlugToLabel[key].slug,
    label: areaSlugToLabel[key].label,
    starred: starredSet.has(key),
    total_agencies: areaTotal[key] ?? 0,
  }));

  // Posizioni SERP correnti (matrice_serp_positions)
  const { data: posRows, error: posErr } = await supabase
    .from("matrice_serp_positions")
    .select("area_type, area_slug, skill_slug, query, position, url, checked_at")
    .eq("domain_id", domainId);
  if (posErr) return NextResponse.json({ error: posErr.message }, { status: 500 });

  // serpMatrix[areaKey][skillSlug] = { position, url, query, checked_at }
  const serpMatrix: Record<
    string,
    Record<
      string,
      {
        position: number | null;
        url: string | null;
        query: string;
        checked_at: string;
      }
    >
  > = {};
  for (const r of posRows ?? []) {
    const row = r as {
      area_type: string;
      area_slug: string;
      skill_slug: string;
      query: string;
      position: number | null;
      url: string | null;
      checked_at: string;
    };
    const key = `${row.area_type}:${row.area_slug}`;
    if (!serpMatrix[key]) serpMatrix[key] = {};
    serpMatrix[key][row.skill_slug] = {
      position: row.position,
      url: row.url,
      query: row.query,
      checked_at: row.checked_at,
    };
  }

  return NextResponse.json({
    skills: skills.map((s) => ({
      slug: s.slug,
      label: s.label,
      query_modifier: s.query_modifier,
    })),
    areas: areasOrdered,
    agency_matrix: agencyMatrix, // count agenzie per cella (per grigio/opacity)
    serp_matrix: serpMatrix, // posizione miglioreagenzia.it per cella
    min_agencies_threshold: 5, // celle < 5 non vengono scansionate
  });
}
