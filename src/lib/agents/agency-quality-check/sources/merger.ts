// Merger per l'agente agency-quality-check.
// Data una lista di agenzie duplicate hard (stesso place_id / domain / vat),
// sceglie il winner secondo la priorità documentata e mergia i loser dentro.
// Poi trasha i loser (publish_status='trash') con nota curatore.

import type { SupabaseClient } from "@supabase/supabase-js";

// Campi che ci servono per selezione winner + merge. Ogni consumer che
// vuole chiamare mergeAgencies deve fetch-are questo set con SELECT.
export interface AgencyForMerge {
  id: string;
  slug: string | null;
  wp_id: number | null;
  title: string | null;
  title_originale: string | null;
  created_at: string | null;
  updated_at?: string | null;
  last_enriched_at: string | null;
  verifica: string | null;
  status_curatela: string | null;
  publish_status: string | null;
  note_curatore: string | null;

  // Scalari testuali/numerici mergiabili se NULL nel winner
  content: string | null;
  descrizione_breve: string | null;
  citta: string | null;
  regioni: string | null;
  aree: string | null;
  sito_web: string | null;
  email: string | null;
  telefono: string | null;
  indirizzo_completo: string | null;
  anno_di_fondazione: number | null;
  dimensione_team: string | null;
  fascia_di_prezzo: string | null;
  partita_iva: string | null;
  pillar_primario_slug: string | null;
  linkedin: string | null;
  instagram: string | null;
  behance: string | null;
  google_place_id: string | null;
  google_indirizzo: string | null;
  google_telefono: string | null;
  google_sito: string | null;
  google_categoria: string | null;
  google_foto_url: string | null;
  google_rating: number | null;
  google_recensioni_count: number | null;
  match_confidence: number | null;
  foto_del_team: string | null;
  logo_url: string | null;
  parent_slug: string | null;
  incorporation_year: number | null;
  legal_form: string | null;
  declared_methodology: string | null;
  min_project_budget: number | null;
  min_project_currency: string | null;
  typical_project_min: number | null;
  typical_project_max: number | null;
  seo_title: string | null;
  meta_description: string | null;

  // Array text[]
  competenze_core: string[] | null;
  competenze_principali: string[] | null;
  altre_competenze: string[] | null;
  caratteristiche: string[] | null;
  lingue: string[] | null;
  alternate_names: string[] | null;
  deliverables: string[] | null;
  platforms_tech: string[] | null;
  industries: string[] | null;
  audiences: string[] | null;
  ideal_client_sizes: string[] | null;
  engagement_models: string[] | null;
  pricing_models: string[] | null;

  // JSONB (array di oggetti con source_url per dedup)
  photos: unknown | null;
  portfolio: unknown | null;
  case_studies: unknown | null;

  // JSONB liberi
  founder_leader: unknown | null;
  differentiators: unknown | null;
  faq: unknown | null;
  best_for: unknown | null;
  less_suitable_for: unknown | null;
}

export interface MergeResult {
  winner_id: string;
  loser_ids: string[];
  fields_merged: string[];
}

// Campi immutabili: NON copiare mai dai loser.
const IMMUTABLE_FIELDS = new Set<string>([
  "id",
  "slug",
  "wp_id",
  "title",
  "title_originale",
  "created_at",
  "updated_at",
  "publish_status",
  "verifica",
  "status_curatela",
  "note_curatore",
  "domain_id",
]);

// Array text[] da mergere con concat + dedup (case-insensitive).
const TEXT_ARRAY_FIELDS: Array<keyof AgencyForMerge> = [
  "competenze_core",
  "competenze_principali",
  "altre_competenze",
  "caratteristiche",
  "lingue",
  "alternate_names",
  "deliverables",
  "platforms_tech",
  "industries",
  "audiences",
  "ideal_client_sizes",
  "engagement_models",
  "pricing_models",
];

// JSONB array of objects con source_url per dedup.
const JSONB_ARRAY_FIELDS: Array<keyof AgencyForMerge> = [
  "photos",
  "portfolio",
  "case_studies",
];

// Tutti gli altri campi scalari che vogliamo copiare se NULL nel winner.
// (Enumerato: evita di scivolare su campi immutabili tramite Object.keys.)
const SCALAR_FILL_FIELDS: Array<keyof AgencyForMerge> = [
  "content",
  "descrizione_breve",
  "citta",
  "regioni",
  "aree",
  "sito_web",
  "email",
  "telefono",
  "indirizzo_completo",
  "anno_di_fondazione",
  "dimensione_team",
  "fascia_di_prezzo",
  "partita_iva",
  "pillar_primario_slug",
  "linkedin",
  "instagram",
  "behance",
  "google_place_id",
  "google_indirizzo",
  "google_telefono",
  "google_sito",
  "google_categoria",
  "google_foto_url",
  "google_rating",
  "google_recensioni_count",
  "match_confidence",
  "foto_del_team",
  "logo_url",
  "parent_slug",
  "incorporation_year",
  "legal_form",
  "declared_methodology",
  "min_project_budget",
  "min_project_currency",
  "typical_project_min",
  "typical_project_max",
  "seo_title",
  "meta_description",
  "founder_leader",
  "differentiators",
  "faq",
  "best_for",
  "less_suitable_for",
];

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function countNonNullFields(a: AgencyForMerge): number {
  let n = 0;
  for (const [k, v] of Object.entries(a)) {
    if (IMMUTABLE_FIELDS.has(k)) continue;
    if (!isEmpty(v)) n++;
  }
  return n;
}

// Ordine di priorità per la selezione del winner:
// 1. verifica='verified'
// 2. status_curatela='verificata'
// 3. Più campi non-null
// 4. wp_id != null (già su WP)
// 5. last_enriched_at più recente
// 6. created_at più vecchio (fallback deterministico)
export function selectWinner(agencies: AgencyForMerge[]): AgencyForMerge {
  if (agencies.length === 0) throw new Error("selectWinner: empty list");
  if (agencies.length === 1) return agencies[0];

  const sorted = [...agencies].sort((a, b) => {
    // 1. verified batte tutti
    const aVerified = a.verifica === "verified" ? 1 : 0;
    const bVerified = b.verifica === "verified" ? 1 : 0;
    if (aVerified !== bVerified) return bVerified - aVerified;

    // 2. status_curatela verificata
    const aCur = a.status_curatela === "verificata" ? 1 : 0;
    const bCur = b.status_curatela === "verificata" ? 1 : 0;
    if (aCur !== bCur) return bCur - aCur;

    // 3. più campi non-null
    const aFields = countNonNullFields(a);
    const bFields = countNonNullFields(b);
    if (aFields !== bFields) return bFields - aFields;

    // 4. wp_id != null
    const aWp = a.wp_id != null ? 1 : 0;
    const bWp = b.wp_id != null ? 1 : 0;
    if (aWp !== bWp) return bWp - aWp;

    // 5. last_enriched_at più recente
    const aEnr = a.last_enriched_at ? new Date(a.last_enriched_at).getTime() : 0;
    const bEnr = b.last_enriched_at ? new Date(b.last_enriched_at).getTime() : 0;
    if (aEnr !== bEnr) return bEnr - aEnr;

    // 6. created_at più vecchio
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aCreated - bCreated;
  });

  return sorted[0];
}

// Dedup case-insensitive di array di stringhe (case originale preservato).
function dedupStringArray(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (typeof v !== "string") continue;
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

// Concat + dedup di array di oggetti su chiave `source_url` (fallback: JSON stringify).
function mergeJsonbArray(current: unknown, extra: unknown): { merged: unknown[]; changed: boolean } {
  const currArr = Array.isArray(current) ? (current as unknown[]) : [];
  const extraArr = Array.isArray(extra) ? (extra as unknown[]) : [];
  if (extraArr.length === 0) return { merged: currArr, changed: false };

  const seen = new Set<string>();
  const dedupKey = (item: unknown): string => {
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const src = rec.source_url ?? rec.public_url ?? rec.url;
      if (typeof src === "string" && src) return `url:${src}`;
    }
    try {
      return `json:${JSON.stringify(item)}`;
    } catch {
      return `raw:${String(item)}`;
    }
  };

  const out: unknown[] = [];
  for (const it of currArr) {
    const k = dedupKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  let added = 0;
  for (const it of extraArr) {
    const k = dedupKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
    added++;
  }
  return { merged: out, changed: added > 0 };
}

// -----------------------------------------------------------------------
// Merge principale
// -----------------------------------------------------------------------

export async function mergeAgencies(
  supabase: SupabaseClient,
  agencies: AgencyForMerge[],
  reason: string,
): Promise<MergeResult> {
  if (agencies.length < 2) {
    throw new Error("mergeAgencies: need >=2 agencies");
  }

  const winner = selectWinner(agencies);
  const losers = agencies.filter((a) => a.id !== winner.id);

  // Costruisci payload update sul winner
  const winnerPatch: Record<string, unknown> = {};
  const fieldsMerged = new Set<string>();

  // Snapshot mutable dei valori "correnti" del winner mentre iteriamo sui loser
  const currentValues: Record<string, unknown> = { ...winner };

  for (const loser of losers) {
    // Scalar fields: fill-if-empty
    for (const field of SCALAR_FILL_FIELDS) {
      if (IMMUTABLE_FIELDS.has(field as string)) continue;
      const winnerVal = currentValues[field as string];
      const loserVal = loser[field];
      if (isEmpty(winnerVal) && !isEmpty(loserVal)) {
        winnerPatch[field as string] = loserVal;
        currentValues[field as string] = loserVal;
        fieldsMerged.add(field as string);
      }
    }

    // Array text[]: concat + dedup
    for (const field of TEXT_ARRAY_FIELDS) {
      const winnerArr = (currentValues[field as string] as string[] | null) ?? [];
      const loserArr = (loser[field] as string[] | null) ?? [];
      if (loserArr.length === 0) continue;
      const combined = dedupStringArray([...winnerArr, ...loserArr]);
      if (combined.length !== winnerArr.length) {
        winnerPatch[field as string] = combined;
        currentValues[field as string] = combined;
        fieldsMerged.add(field as string);
      }
    }

    // JSONB array of objects: concat + dedup su source_url
    for (const field of JSONB_ARRAY_FIELDS) {
      const winnerVal = currentValues[field as string];
      const loserVal = loser[field];
      const { merged, changed } = mergeJsonbArray(winnerVal, loserVal);
      if (changed) {
        winnerPatch[field as string] = merged;
        currentValues[field as string] = merged;
        fieldsMerged.add(field as string);
      }
    }
  }

  // Applica update al winner (se ci sono campi da mergere)
  if (Object.keys(winnerPatch).length > 0) {
    winnerPatch.updated_at = new Date().toISOString();
    const { error: winErr } = await supabase
      .from("agencies")
      .update(winnerPatch)
      .eq("id", winner.id);
    if (winErr) {
      throw new Error(`mergeAgencies: winner update failed (${winner.id}): ${winErr.message}`);
    }
  }

  // Soft-delete dei loser
  for (const loser of losers) {
    const prevNote = loser.note_curatore?.trim() ?? "";
    const mergeNote = `Merged into ${winner.id} — ${reason}`;
    const nextNote = prevNote ? `${prevNote}\n${mergeNote}` : mergeNote;
    const { error: losErr } = await supabase
      .from("agencies")
      .update({
        publish_status: "trash",
        note_curatore: nextNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loser.id);
    if (losErr) {
      throw new Error(`mergeAgencies: loser trash failed (${loser.id}): ${losErr.message}`);
    }
  }

  return {
    winner_id: winner.id,
    loser_ids: losers.map((l) => l.id),
    fields_merged: Array.from(fieldsMerged),
  };
}
