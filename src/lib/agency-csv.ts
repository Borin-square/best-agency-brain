// Parser CSV + mapping colonne WP All Import → schema agencies.
// Usato sia dallo script CLI (scripts/import-csv.ts) sia dalla route API
// (/api/agencies/import) per garantire mapping consistente.

// Auto-detect separatore analizzando la prima riga (fino a 2000 chars).
// Supporta virgola, punto e virgola (Excel IT/EU), tab.
function detectSeparator(text: string): "," | ";" | "\t" {
  const sample = text.slice(0, 2000);
  const firstLineEnd = sample.indexOf("\n");
  const firstLine = firstLineEnd === -1 ? sample : sample.slice(0, firstLineEnd);

  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const c of firstLine) {
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && c in counts) counts[c]++;
  }
  const best = (Object.keys(counts) as Array<"," | ";" | "\t">).reduce((a, b) =>
    counts[a] >= counts[b] ? a : b,
  );
  return counts[best] > 0 ? best : ",";
}

// ---- Parser CSV minimalista (auto-detect separatore, gestisce quote + newline dentro campo + "" escape) ----
export function parseCsv(text: string): Record<string, string>[] {
  const sep = detectSeparator(text);

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
      } else if (c === sep) {
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
  rows[0][0] = rows[0][0].replace(/^\uFEFF/, ""); // strip BOM
  const headers = rows[0];
  return rows
    .slice(1)
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
export function mapAgencyRow(row: Record<string, string>): Record<string, unknown> | null {
  const title = nn(row["Title"]);
  if (!title) return null;

  const wpIdRaw = nnInt(row["ID"]);
  const slugBase = slugify(title) || `agency-${wpIdRaw ?? Date.now()}`;

  // CSV WP ha una sola colonna "Competenze" (flat pipe-list). Splittiamo per
  // rispettare i cap del DB: prime 5 → principali, successive 10 → altre.
  // Nessuna finisce in "core" da import: la classificazione core è compito
  // dell'agent updater (che vede tutto il sito).
  const compRaw = pipeToArr(row["Competenze"]) ?? [];
  const competenze_principali = compRaw.length > 0 ? compRaw.slice(0, 5) : null;
  const altre_competenze = compRaw.length > 5 ? compRaw.slice(5, 15) : null;

  return {
    wp_id: wpIdRaw,
    slug: wpIdRaw ? `${slugBase}-${wpIdRaw}` : slugBase,

    title,
    content: nn(row["Content"]),
    competenze_principali,
    altre_competenze,
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
