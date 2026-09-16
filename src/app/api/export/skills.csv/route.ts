import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Export CSV della tassonomia competenze (agency_skills) con modificatore
// per WP All Import. Ogni riga = una skill.
//
// Usato lato WP per generare le pagine di listing con qualificatore
// corretto: "Migliori {modifier} {label} a {città}".

const CSV_HEADERS = [
  "Slug",
  "Label",
  "Modificatore",
  "Sort order",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
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
    .select("slug, label, query_modifier, sort_order")
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
  }>;

  const lines = [
    CSV_HEADERS.join(","),
    ...rows.map((r) =>
      [r.slug, r.label, r.query_modifier ?? "agenzia", r.sort_order ?? 0]
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
