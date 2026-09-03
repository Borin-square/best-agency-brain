import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Ritorna una matrice competenza × area per la tab Matrice.
// Le "aree" sono regioni + città mischiate. Ordine: starred prima (nell'ordine
// salvato su network_domains.starred_areas), poi le altre per count desc,
// tie-break alfabetico su label.
export async function GET(req: NextRequest) {
  const domainId = new URL(req.url).searchParams.get("domain_id")?.trim();
  if (!domainId) {
    return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Dominio + starred
  const { data: dom, error: domErr } = await supabase
    .from("network_domains")
    .select("id, starred_areas")
    .eq("id", domainId)
    .single();
  if (domErr || !dom) {
    return NextResponse.json({ error: domErr?.message ?? "domain_not_found" }, { status: 404 });
  }

  // Skill permesse per il dominio (labeling + ordine)
  const { data: skillRows, error: skErr } = await supabase
    .from("agency_skills")
    .select("slug, label, sort_order")
    .eq("domain_id", domainId)
    .order("sort_order", { ascending: true });
  if (skErr) return NextResponse.json({ error: skErr.message }, { status: 500 });
  const skills = (skillRows ?? []) as Array<{ slug: string; label: string; sort_order: number }>;

  // Agenzie del dominio (solo pubblicabili, no trash)
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

  // Aggregation: matrix[areaKey][skillSlug] = count; areaTotal[areaKey] = count agenzie totali (distinct)
  // areaKey formato "regione:marche" | "citta:milano"
  const matrix: Record<string, Record<string, number>> = {};
  const areaTotal: Record<string, number> = {};
  const areaSlugToLabel: Record<string, { type: "regione" | "citta"; slug: string; label: string }> = {};

  const capitalize = (s: string) =>
    s
      .split("-")
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
      if (!matrix[areaKey]) matrix[areaKey] = {};
      for (const skill of skillsUnion) {
        matrix[areaKey][skill] = (matrix[areaKey][skill] ?? 0) + 1;
      }
    }
  }

  // Ordering delle aree: starred prima (ordine salvato) + resto per count desc + alfabetico
  const starredRaw = Array.isArray(dom.starred_areas) ? (dom.starred_areas as Array<{ type: string; slug: string }>) : [];
  const starredKeys: string[] = starredRaw
    .filter((s) => s && (s.type === "regione" || s.type === "citta") && typeof s.slug === "string")
    .map((s) => `${s.type}:${s.slug}`);
  const starredSet = new Set(starredKeys);

  // Includi eventuali starred non presenti nei dati (mostreremo count=0)
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

  const areasOrdered = [...starredKeys.filter((k) => areaSlugToLabel[k]), ...nonStarred].map((key) => ({
    key,
    type: areaSlugToLabel[key].type,
    slug: areaSlugToLabel[key].slug,
    label: areaSlugToLabel[key].label,
    starred: starredSet.has(key),
    total_agencies: areaTotal[key] ?? 0,
  }));

  return NextResponse.json({
    skills: skills.map((s) => ({ slug: s.slug, label: s.label })),
    areas: areasOrdered,
    matrix, // matrix[areaKey][skillSlug] = count
  });
}
