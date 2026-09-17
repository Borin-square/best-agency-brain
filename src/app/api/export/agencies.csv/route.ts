import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Ordine delle colonne come da template WP All Import + 3 nuove per la
// classificazione competenze (core/principali/altre). "Competenze" resta come
// union flat per retrocompat WP.
const CSV_HEADERS = [
  "ID",
  "Title",
  "Content",
  "Competenze",
  "Competenze core",
  "Competenze principali",
  "Altre competenze",
  "Caratteristiche",
  "Aree",
  "Città",
  "Regioni",
  "Status curatela",
  "Descrizione breve",
  "Foto del team",
  "Sito web",
  "Email",
  "Telefono",
  "Indirizzo completo",
  "Anno di fondazione",
  "Dimensione team",
  "Lingue",
  "Fascia di prezzo",
  "Partita IVA",
  "Pillar primario (slug)",
  "LinkedIn",
  "Instagram",
  "Behance",
  "Google rating",
  "N. recensioni Google",
  "Match confidence",
  "Indirizzo Google",
  "Telefono Google",
  "Sito Google",
  "Categoria Google",
  "Foto Google (URL)",
  "Google Place ID",
  "Verifica",
  "Title originale",
  "Status pubblicazione",
  "Note curatore",
  "Stato",
  "Featured",

  // ============================================================
  // Colonne data dictionary (migration 0012). Aggiunte in coda per
  // retrocompatibilità: le mappature WP All Import esistenti (colonne 1-42)
  // restano valide. Nomi coerenti col v2 endpoint /api/export/agencies-v2.csv.
  // Arrays → pipe-joined. JSONB → JSON stringified. NULL → stringa vuota.
  // ============================================================

  // Identità estesa
  "Parent slug",
  "Alternate names",
  "Incorporation year",
  "Legal form",
  "Founder leader JSON",

  // Servizi & fit clienti
  "Deliverables",
  "Platforms tech",
  "Industries",
  "Audiences",
  "Ideal client sizes",
  "Engagement models",

  // Pricing strutturato
  "Min project budget",
  "Min project currency",
  "Typical project min",
  "Typical project max",
  "Pricing models",

  // Contenuti strutturati
  "Differentiators JSON",
  "Declared methodology",
  "FAQ JSON",
  "Best for JSON",
  "Less suitable for JSON",

  // Recensioni AI
  "Review summary",
  "Review strengths JSON",
  "Review criticisms JSON",
  "Review analyzed count",
  "Review analysis confidence",
  "Review snapshot date",

  // Valutazione editoriale
  "Editorial summary",
  "Eval strengths JSON",
  "Eval limitations JSON",
  "Evidence grade",
  "Evaluation confidence",
  "Human reviewed",

  // Financial per anno
  "Revenue 2024",
  "Revenue 2025",
  "Revenue 2026",
  "Employees 2024",
  "Employees 2025",
  "Employees 2026",
  "EBITDA 2024",
  "EBITDA 2025",
  "EBITDA 2026",

  // SEO override
  "SEO title",
  "Meta description",
  "Indexation status",

  // Workflow esteso
  "Last verified at",
  "Quality gate score",

  // Portfolio images (jsonb da agency-visual-enrichment)
  "Portfolio JSON",

  // SERP position tracking (agent agency-serp-position)
  "SERP position",
  "SERP query",
  "SERP url",
  "SERP checked at",
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

// Stato agenzia: verificata > arricchita > vuoto
function computeStato(a: Record<string, unknown>): "verificata" | "arricchita" | "vuoto" {
  if (a.verifica === "verified" || a.status_curatela === "verificata") return "verificata";
  const enr = a.enrichment_status;
  if (enr === "success" || enr === "partial" || a.last_enriched_at) return "arricchita";
  return "vuoto";
}

// WP conosce solo la colonna flat "Competenze": la ricomponiamo unendo i 3
// gruppi in ordine di importanza (core → principali → altre), dedup preservando
// l'ordine. Cap totale a 17 (2+5+10).
function competenzeUnion(a: Record<string, unknown>): string[] {
  const core = Array.isArray(a.competenze_core) ? (a.competenze_core as string[]) : [];
  const pri = Array.isArray(a.competenze_principali) ? (a.competenze_principali as string[]) : [];
  const alt = Array.isArray(a.altre_competenze) ? (a.altre_competenze as string[]) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of [...core, ...pri, ...alt]) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function rowToCsv(a: Record<string, unknown>, featuresByAgency: Map<string, string>): string {
  const values = [
    // ---- Colonne legacy (retrocompat mappature WP All Import esistenti) ----
    a.wp_id,
    a.title,
    a.content,
    competenzeUnion(a),
    a.competenze_core,
    a.competenze_principali,
    a.altre_competenze,
    a.caratteristiche,
    a.aree,
    a.citta,
    a.regioni,
    a.status_curatela,
    a.descrizione_breve,
    a.foto_del_team,
    a.sito_web,
    a.email,
    a.telefono,
    a.indirizzo_completo,
    a.anno_di_fondazione,
    a.dimensione_team,
    a.lingue,
    a.fascia_di_prezzo,
    a.partita_iva,
    a.pillar_primario_slug,
    a.linkedin,
    a.instagram,
    a.behance,
    a.google_rating,
    a.google_recensioni_count,
    a.match_confidence,
    a.google_indirizzo,
    a.google_telefono,
    a.google_sito,
    a.google_categoria,
    a.google_foto_url,
    a.google_place_id,
    a.verifica,
    a.title_originale,
    a.publish_status,
    a.note_curatore,
    computeStato(a),
    featuresByAgency.get(a.id as string) ?? "",

    // ---- Colonne data dictionary (in coda, in ordine identico ai CSV_HEADERS) ----
    // Identità estesa
    a.parent_slug,
    a.alternate_names,
    a.incorporation_year,
    a.legal_form,
    a.founder_leader,

    // Servizi & fit clienti
    a.deliverables,
    a.platforms_tech,
    a.industries,
    a.audiences,
    a.ideal_client_sizes,
    a.engagement_models,

    // Pricing strutturato
    a.min_project_budget,
    a.min_project_currency,
    a.typical_project_min,
    a.typical_project_max,
    a.pricing_models,

    // Contenuti strutturati
    a.differentiators,
    a.declared_methodology,
    a.faq,
    a.best_for,
    a.less_suitable_for,

    // Recensioni AI
    a.review_summary,
    a.review_strengths,
    a.review_criticisms,
    a.review_analyzed_count,
    a.review_analysis_confidence,
    a.review_snapshot_date,

    // Valutazione editoriale
    a.editorial_summary,
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

    // SEO override
    a.seo_title,
    a.meta_description,
    a.indexation_status,

    // Workflow esteso
    a.last_verified_at,
    a.quality_gate_score,

    // Portfolio images (jsonb)
    a.portfolio,

    // SERP position tracking
    a.serp_position,
    a.serp_query,
    a.serp_url,
    a.serp_checked_at,
  ];
  return values.map(csvEscape).join(",");
}

// Endpoint pubblico: WP All Import scarica da qui via cron proprio schedule.
// Autenticazione opzionale via query ?token=... (matcha EXPORT_TOKEN env).
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
  // Paginazione: Supabase limita a 1000/query
  const PAGE = 1000;
  const all: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from("agencies")
      .select("*")
      .in("publish_status", ["publish", "draft"])
      .order("wp_id", { ascending: true, nullsFirst: false });
    if (domainId) q = q.eq("domain_id", domainId);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Prefetch agency_features (join sul dominio filtrato lato JOIN Supabase)
  // e raggruppa per agency_id in stringa pipe-list: "type:area:skill:rank|…"
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
  const csv = "\uFEFF" + lines.join("\n"); // BOM per Excel/WP All Import

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="agencies-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
