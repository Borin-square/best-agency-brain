import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Export CSV in formato "data dictionary" — nuovo, affianca il v1.
// WP All Import continua a puntare al v1 finché non si decide di migrare.
// Colonne mancanti nel DB attuale restano vuote; verranno popolate quando
// i campi/tabelle corrispondenti saranno introdotti.

const CSV_HEADERS = [
  // Identità
  "slug",
  "display_name",
  "alternate_names",
  "canonical_website",
  "parent_slug",
  "legal_name",
  "vat_id",
  "legal_form",
  "founding_year",
  "incorporation_year",
  "founder_leader_json",

  // Media
  "logo_url",
  "team_photo_url",

  // Sede principale
  "main_street",
  "main_locality",
  "main_region",
  "main_postal_code",
  "main_country",
  "main_lat",
  "main_lng",

  // Mercati
  "areas_served",

  // Contatti
  "public_email",
  "public_phone",
  "contact_url",
  "linkedin_url",
  "instagram_url",
  "behance_url",
  "facebook_url",
  "youtube_url",

  // Servizi
  "services_core",
  "services_principal",
  "services_other",
  "deliverables",
  "platforms_tech",
  "attributes",

  // Clienti e fit
  "industries",
  "audiences",
  "ideal_client_sizes",
  "languages",
  "engagement_models",
  "min_project_budget",
  "min_project_currency",
  "typical_project_min",
  "typical_project_max",
  "pricing_models",
  "team_size_range",
  "best_for_json",
  "less_suitable_for_json",

  // Recensioni
  "google_rating",
  "google_review_count",
  "google_place_id",
  "google_snapshot_date",
  "review_summary",
  "review_strengths_json",
  "review_criticisms_json",
  "review_analyzed_count",
  "review_analysis_confidence",

  // Contenuti editoriali
  "editorial_short",
  "editorial_long",
  "editorial_summary",
  "differentiators_json",
  "declared_methodology",
  "faq_json",

  // Prove
  "top_cases_json",
  "portfolio_json",

  // Valutazione
  "eval_strengths_json",
  "eval_limitations_json",
  "evidence_grade",
  "evaluation_confidence",
  "human_reviewed",

  // Financial per anno
  "revenue_2024",
  "revenue_2025",
  "revenue_2026",
  "employees_2024",
  "employees_2025",
  "employees_2026",
  "ebitda_2024",
  "ebitda_2025",
  "ebitda_2026",

  // SEO
  "seo_title",
  "meta_description",
  "indexation_status",

  // Workflow
  "curation_status",
  "publication_status",
  "claim_status",
  "last_enriched_at",
  "last_verified_at",
  "quality_gate_score",
  "curator_notes",

  // Commerciale
  "featured",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (Array.isArray(v)) s = v.join("|");
  else if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// alternate_names v2 = title_originale (legacy, singolo) + array alternate_names, dedup ordine-preservante
function mergeAlternateNames(a: Record<string, unknown>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v !== "string") return;
    const s = v.trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  push(a.title_originale);
  const arr = Array.isArray(a.alternate_names) ? (a.alternate_names as unknown[]) : [];
  for (const v of arr) push(v);
  return out;
}

function rowToCsv(a: Record<string, unknown>, featuresByAgency: Map<string, string>): string {
  const values: unknown[] = [
    // Identità
    a.slug,
    a.title,
    mergeAlternateNames(a),
    a.sito_web,
    a.parent_slug,
    null, // legal_name — non ancora in DB
    a.partita_iva,
    a.legal_form,
    a.anno_di_fondazione,
    a.incorporation_year,
    a.founder_leader,

    // Media
    a.logo_url,
    a.foto_del_team,

    // Sede principale
    a.google_indirizzo ?? a.indirizzo_completo,
    a.citta,
    a.regioni,
    null, // main_postal_code — non ancora in DB
    null, // main_country — non ancora in DB
    null, // main_lat — non ancora in DB
    null, // main_lng — non ancora in DB

    // Mercati
    a.aree,

    // Contatti
    a.email,
    a.telefono ?? a.google_telefono,
    null, // contact_url — non ancora in DB
    a.linkedin,
    a.instagram,
    a.behance,
    null, // facebook_url — non ancora in DB
    null, // youtube_url — non ancora in DB

    // Servizi
    a.competenze_core,
    a.competenze_principali,
    a.altre_competenze,
    a.deliverables,
    a.platforms_tech,
    a.caratteristiche,

    // Clienti e fit
    a.industries,
    a.audiences,
    a.ideal_client_sizes,
    a.lingue,
    a.engagement_models,
    a.min_project_budget,
    a.min_project_currency,
    a.typical_project_min,
    a.typical_project_max,
    a.pricing_models,
    a.dimensione_team,
    a.best_for,
    a.less_suitable_for,

    // Recensioni
    a.google_rating,
    a.google_recensioni_count,
    a.google_place_id,
    a.review_snapshot_date,
    a.review_summary,
    a.review_strengths,
    a.review_criticisms,
    a.review_analyzed_count,
    a.review_analysis_confidence,

    // Contenuti editoriali
    a.descrizione_breve,
    a.content,
    a.editorial_summary,
    a.differentiators,
    a.declared_methodology,
    a.faq,

    // Prove
    a.case_studies,
    a.portfolio,

    // Valutazione
    a.eval_strengths,
    a.eval_limitations,
    a.evidence_grade,
    a.evaluation_confidence,
    a.human_reviewed,

    // Financial per anno
    a.revenue_2024,
    a.revenue_2025,
    a.revenue_2026,
    a.employees_2024,
    a.employees_2025,
    a.employees_2026,
    a.ebitda_2024,
    a.ebitda_2025,
    a.ebitda_2026,

    // SEO
    a.seo_title,
    a.meta_description,
    a.indexation_status,

    // Workflow
    a.status_curatela,
    a.publish_status,
    a.verifica,
    a.last_enriched_at,
    a.last_verified_at,
    a.quality_gate_score,
    a.note_curatore,

    // Commerciale
    featuresByAgency.get(a.id as string) ?? "",
  ];
  return values.map(csvEscape).join(",");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const expected = process.env.EXPORT_TOKEN;
  if (expected) {
    const token = url.searchParams.get("token");
    if (token !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const domainId = url.searchParams.get("domain_id")?.trim();

  const supabase = createServiceClient();
  const PAGE = 1000;
  const all: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from("agencies")
      .select("*")
      .in("publish_status", ["publish", "draft"])
      .order("slug", { ascending: true, nullsFirst: false });
    if (domainId) q = q.eq("domain_id", domainId);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Featured aggregato per agenzia in stringa pipe-list (stesso formato del v1)
  let featQuery = supabase
    .from("agency_features")
    .select("agency_id, area_type, area_slug, skill_slug, sort_order, agencies!inner(domain_id)")
    .order("sort_order", { ascending: true });
  if (domainId) featQuery = featQuery.eq("agencies.domain_id", domainId);
  const { data: featRows, error: fErr } = await featQuery;
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  const featuresByAgency = new Map<string, string>();
  for (const r of featRows ?? []) {
    const row = r as {
      agency_id: string;
      area_type: string;
      area_slug: string;
      skill_slug: string;
      sort_order: number;
    };
    const entry = `${row.area_type}:${row.area_slug}:${row.skill_slug}:${row.sort_order}`;
    const cur = featuresByAgency.get(row.agency_id);
    featuresByAgency.set(row.agency_id, cur ? `${cur}|${entry}` : entry);
  }

  const lines = [CSV_HEADERS.join(","), ...all.map((a) => rowToCsv(a, featuresByAgency))];
  const csv = "\uFEFF" + lines.join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="agencies-v2-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
