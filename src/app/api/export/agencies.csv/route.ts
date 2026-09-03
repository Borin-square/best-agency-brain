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
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("|") : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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

function rowToCsv(a: Record<string, unknown>): string {
  const values = [
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

  const lines = [CSV_HEADERS.join(","), ...all.map(rowToCsv)];
  const csv = "\uFEFF" + lines.join("\n"); // BOM per Excel/WP All Import

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="agencies-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
