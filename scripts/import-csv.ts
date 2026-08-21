// One-shot import: legge CSV WP All Import → upsert in agencies.
//
// Uso:
//   npx tsx scripts/import-csv.ts /path/to/Agenzie-Export.csv
//
// Richiede in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const CSV_PATH = process.argv[2];
if (!CSV_PATH) {
  console.error("Usage: tsx scripts/import-csv.ts <path-to-csv>");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- CSV parser minimalista (gestisce virgolette, newline dentro campi, escape "") ----
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\r") {
        // ignore
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  // Rimuovi BOM
  rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  const headers = rows[0];
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? "";
      });
      return obj;
    });
}

// ---- Helpers di normalizzazione ----
const nn = (s: string | undefined | null): string | null => {
  if (!s) return null;
  const t = s.trim();
  return t === "" ? null : t;
};

const nnInt = (s: string | undefined | null): number | null => {
  const v = nn(s);
  if (v === null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const nnNum = (s: string | undefined | null): number | null => {
  const v = nn(s);
  if (v === null) return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const pipeToArr = (s: string | undefined | null): string[] | null => {
  const v = nn(s);
  if (v === null) return null;
  return v.split("|").map((x) => x.trim()).filter(Boolean);
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ---- Mapping colonne CSV → schema DB ----
function mapRow(row: Record<string, string>): Record<string, unknown> | null {
  const title = nn(row["Title"]);
  if (!title) return null;

  const wpIdRaw = nnInt(row["ID"]);
  const slugBase = slugify(title) || `agency-${wpIdRaw ?? Date.now()}`;

  return {
    wp_id: wpIdRaw,
    slug: wpIdRaw ? `${slugBase}-${wpIdRaw}` : slugBase,

    title,
    content: nn(row["Content"]),
    competenze: pipeToArr(row["Competenze"]),
    caratteristiche: pipeToArr(row["Caratteristiche"]),
    aree: nn(row["Aree"]),
    citta: nn(row["Città"]),
    regioni: nn(row["Regioni"]),
    status_curatela: nn(row["Status curatela"]),

    descrizione_breve: nn(row["Descrizione breve"]),
    foto_del_team: nn(row["Foto del team"]),
    sito_web: nn(row["Sito web"]),
    email: nn(row["Email"]),
    telefono: nn(row["Telefono"]),
    indirizzo_completo: nn(row["Indirizzo completo"]),
    anno_di_fondazione: nnInt(row["Anno di fondazione"]),
    dimensione_team: nn(row["Dimensione team"]),
    lingue: pipeToArr(row["Lingue"]),
    fascia_di_prezzo: nn(row["Fascia di prezzo"]),
    partita_iva: nn(row["Partita IVA"]),

    pillar_primario_slug: nn(row["Pillar primario (slug)"]),
    linkedin: nn(row["LinkedIn"]),
    instagram: nn(row["Instagram"]),
    behance: nn(row["Behance"]),

    google_rating: nnNum(row["Google rating"]),
    google_recensioni_count: nnInt(row["N. recensioni Google"]),
    match_confidence: nnNum(row["Match confidence"]),
    google_indirizzo: nn(row["Indirizzo Google"]),
    google_telefono: nn(row["Telefono Google"]),
    google_sito: nn(row["Sito Google"]),
    google_categoria: nn(row["Categoria Google"]),
    google_foto_url: nn(row["Foto Google (URL)"]),
    google_place_id: nn(row["Google Place ID"]),

    verifica: nn(row["Verifica"]),
    title_originale: nn(row["Title originale"]),
    publish_status: nn(row["Status pubblicazione"]) ?? "publish",
    note_curatore: nn(row["Note curatore"]),
  };
}

// ---- Main ----
async function main() {
  const csvPath = path.resolve(CSV_PATH);
  console.log(`Reading ${csvPath}…`);
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(raw);
  console.log(`Parsed ${rows.length} rows`);

  const mapped = rows.map(mapRow).filter((r): r is Record<string, unknown> => r !== null);
  console.log(`Mapped ${mapped.length} valid rows (${rows.length - mapped.length} skipped)`);

  // Upsert in chunks di 200 (limite payload Supabase / velocità)
  const CHUNK = 200;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < mapped.length; i += CHUNK) {
    const chunk = mapped.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from("agencies")
      .upsert(chunk, { onConflict: "wp_id", ignoreDuplicates: false, count: "exact" });

    if (error) {
      console.error(`Chunk ${i / CHUNK + 1} error:`, error.message);
      errors += chunk.length;
    } else {
      imported += count ?? chunk.length;
      console.log(`  ✓ Chunk ${i / CHUNK + 1}: ${chunk.length} rows (running total: ${imported})`);
    }
  }

  console.log(`\nDone. Imported/updated ${imported}, errors ${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
