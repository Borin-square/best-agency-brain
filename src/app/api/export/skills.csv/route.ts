import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Export CSV della tassonomia competenze (agency_skills) per WP All Import.
// Formato allineato al file WP: Term ID (vuoto, match per slug), Term Name,
// Term Slug, Definizione SEO — poi campi extra in coda.

const CSV_HEADERS = [
  "Term ID",
  "Term Name",
  "Term Slug",
  "Definizione SEO",
  "Modificatore",
  "Sort order",
  "FAQ",
  "Guide correlate",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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
  let q = supabase
    .from("agency_skills")
    .select("slug, label, query_modifier, sort_order, descrizione, faq, guide_correlate")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  if (domainId) q = q.eq("domain_id", domainId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<{
    slug: string;
    label: string;
    query_modifier: string | null;
    sort_order: number | null;
    descrizione: string | null;
    faq: Array<{ domanda: string; risposta: string }> | null;
    guide_correlate: Array<{ titolo: string; url: string }> | null;
  }>;

  const lines = [
    CSV_HEADERS.join(","),
    ...rows.map((r) =>
      [
        "",                          // Term ID — vuoto, WP All Import matcha per slug
        r.label,                     // Term Name
        r.slug,                      // Term Slug
        r.descrizione ?? "",         // Definizione SEO
        r.query_modifier ?? "agenzia",
        r.sort_order ?? 0,
        r.faq && r.faq.length > 0 ? JSON.stringify(r.faq) : "",
        r.guide_correlate && r.guide_correlate.length > 0 ? JSON.stringify(r.guide_correlate) : "",
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];
  const csv = "\uFEFF" + lines.join("\n"); // BOM per Excel/WP All Import

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="skills-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
