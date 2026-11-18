// Campi della tabella agencies modificabili a mano dalla scheda agenzia, con il tipo di input.
// Usato sia dal PATCH /api/agencies/[id] (whitelist + conversione) sia dalla UI (input da mostrare).
//
// Restano fuori: campi di sistema (id, slug, domain_id, timestamp), quelli calcolati (serp_*,
// enrichment_*, match_confidence, quality_gate_score) e i media del visual agent (il logo ha il suo
// editor). Ogni campo salvato a mano finisce in manual_fields: l'agency-updater non lo tocca più
// finché non viene sbloccato.

export type EditType =
  | "text"
  | "textarea"
  | "int"
  | "num"
  | "bool"
  | "tags"
  | "json"
  | "date"
  | "datetime"
  | "select";

export interface EditSpec {
  type: EditType;
  options?: string[]; // per select
  max?: number; // per tags: numero massimo di elementi
  required?: boolean;
}

const t = (type: EditType, extra: Omit<EditSpec, "type"> = {}): EditSpec => ({ type, ...extra });

export const EDITABLE_FIELDS: Record<string, EditSpec> = {
  // Core
  title: t("text", { required: true }),
  verifica: t("text"),
  status_curatela: t("text"),
  publish_status: t("select", { options: ["draft", "pending", "publish", "trash"] }),
  pillar_primario_slug: t("text"),
  content: t("textarea"),
  descrizione_breve: t("textarea"),
  competenze_core: t("tags", { max: 2 }),
  competenze_principali: t("tags", { max: 5 }),
  altre_competenze: t("tags", { max: 10 }),
  caratteristiche: t("tags"),
  aree: t("text"),
  citta: t("text"),
  regioni: t("text"),

  // Contatti & sede
  sito_web: t("text"),
  email: t("text"),
  telefono: t("text"),
  indirizzo_completo: t("text"),
  anno_di_fondazione: t("int"),
  dimensione_team: t("text"),
  lingue: t("tags"),
  fascia_di_prezzo: t("text"),
  partita_iva: t("text"),

  // Social
  linkedin: t("text"),
  instagram: t("text"),
  behance: t("text"),

  // Google Places (correzione di un match sbagliato)
  google_categoria: t("text"),
  google_telefono: t("text"),
  google_sito: t("text"),
  google_indirizzo: t("text"),
  google_place_id: t("text"),

  // Identità estesa
  parent_slug: t("text"),
  legal_form: t("text"),
  incorporation_year: t("int"),
  alternate_names: t("tags"),
  founder_leader: t("json"),

  // Servizi & fit
  deliverables: t("tags"),
  platforms_tech: t("tags"),
  industries: t("tags"),
  audiences: t("tags"),
  ideal_client_sizes: t("tags"),
  engagement_models: t("tags"),

  // Pricing
  min_project_budget: t("int"),
  min_project_currency: t("text"),
  typical_project_min: t("int"),
  typical_project_max: t("int"),
  pricing_models: t("tags"),

  // Contenuti strutturati
  differentiators: t("json"),
  declared_methodology: t("textarea"),
  faq: t("json"),
  best_for: t("json"),
  less_suitable_for: t("json"),

  // Recensioni
  review_summary: t("textarea"),
  review_strengths: t("json"),
  review_criticisms: t("json"),
  review_analyzed_count: t("int"),
  review_analysis_confidence: t("text"),
  review_snapshot_date: t("date"),

  // Valutazione editoriale
  editorial_summary: t("textarea"),
  eval_strengths: t("json"),
  eval_limitations: t("json"),
  evidence_grade: t("text"),
  evaluation_confidence: t("text"),
  human_reviewed: t("bool"),

  // Financial
  revenue_2024: t("num"),
  revenue_2025: t("num"),
  revenue_2026: t("num"),
  employees_2024: t("int"),
  employees_2025: t("int"),
  employees_2026: t("int"),
  ebitda_2024: t("num"),
  ebitda_2025: t("num"),
  ebitda_2026: t("num"),

  // SEO
  seo_title: t("text"),
  meta_description: t("textarea"),
  indexation_status: t("select", { options: ["noindex", "eligible", "index"] }),

  // Workflow
  note_curatore: t("textarea"),
  last_verified_at: t("datetime"),
  google_partner_cert: t("bool"),
};

export type CoerceResult = { ok: true; value: unknown } | { ok: false; error: string };

// Converte il valore arrivato dal client nel tipo della colonna. Stringa vuota → null (array → []).
export function coerceFieldValue(key: string, raw: unknown): CoerceResult {
  const spec = EDITABLE_FIELDS[key];
  if (!spec) return { ok: false, error: `campo non modificabile: ${key}` };

  const empty = raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "");

  if (spec.required && empty) return { ok: false, error: `${key} è obbligatorio` };

  switch (spec.type) {
    case "text":
    case "textarea": {
      if (empty) return { ok: true, value: null };
      if (typeof raw !== "string") return { ok: false, error: `${key}: atteso testo` };
      return { ok: true, value: raw.trim() };
    }
    case "select": {
      if (empty) return { ok: true, value: null };
      if (typeof raw !== "string" || !spec.options?.includes(raw)) {
        return { ok: false, error: `${key}: valore non ammesso (${spec.options?.join(", ")})` };
      }
      return { ok: true, value: raw };
    }
    case "int":
    case "num": {
      if (empty) return { ok: true, value: null };
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
      if (!Number.isFinite(n)) return { ok: false, error: `${key}: atteso un numero` };
      if (spec.type === "int" && !Number.isInteger(n)) {
        return { ok: false, error: `${key}: atteso un numero intero` };
      }
      return { ok: true, value: n };
    }
    case "bool": {
      if (empty) return { ok: true, value: null };
      if (typeof raw !== "boolean") return { ok: false, error: `${key}: atteso sì/no` };
      return { ok: true, value: raw };
    }
    case "tags": {
      if (empty) return { ok: true, value: [] };
      if (!Array.isArray(raw) || raw.some((x) => typeof x !== "string")) {
        return { ok: false, error: `${key}: attesa una lista di testi` };
      }
      const list = Array.from(new Set(raw.map((x: string) => x.trim()).filter(Boolean)));
      if (spec.max && list.length > spec.max) {
        return { ok: false, error: `${key}: massimo ${spec.max} elementi` };
      }
      return { ok: true, value: list };
    }
    case "json": {
      if (empty) return { ok: true, value: null };
      return { ok: true, value: raw };
    }
    case "date": {
      if (empty) return { ok: true, value: null };
      if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return { ok: false, error: `${key}: attesa una data AAAA-MM-GG` };
      }
      return { ok: true, value: raw };
    }
    case "datetime": {
      if (empty) return { ok: true, value: null };
      const d = new Date(String(raw));
      if (Number.isNaN(d.getTime())) return { ok: false, error: `${key}: data non valida` };
      return { ok: true, value: d.toISOString() };
    }
  }
}
