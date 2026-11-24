// Sedi delle agenzie (tabella agency_sedi, docs/sedi-progetto.md).
// Una sede italiana ha un comune (elenco ISTAT): provincia e regione le calcola il DB. Una sede estera
// ha paese e città libera e non entra negli archivi del sito. Le regole vere stanno nel DB (vincoli e
// trigger delle migrazioni 0043-0045): qui solo i tipi, la lettura e i messaggi d'errore leggibili.

import type { SupabaseClient } from "@supabase/supabase-js";

export const FONTI_SEDE = ["sito", "google", "agenzia", "verifica", "migrazione"] as const;
export type FonteSede = (typeof FONTI_SEDE)[number];

export const ETICHETTE_FONTE: Record<FonteSede, string> = {
  sito: "Sito dell'agenzia",
  google: "Google",
  agenzia: "Segnalata dall'agenzia",
  verifica: "Verifica a mano",
  migrazione: "Dati migrati",
};

// Paesi proposti nel menu (ISO 3166-1 alpha-2). Un codice non in elenco si mostra così com'è.
export const PAESI: Array<[string, string]> = [
  ["IT", "Italia"],
  ["CH", "Svizzera"],
  ["SM", "San Marino"],
  ["FR", "Francia"],
  ["DE", "Germania"],
  ["AT", "Austria"],
  ["ES", "Spagna"],
  ["PT", "Portogallo"],
  ["GB", "Regno Unito"],
  ["IE", "Irlanda"],
  ["NL", "Paesi Bassi"],
  ["BE", "Belgio"],
  ["LU", "Lussemburgo"],
  ["MT", "Malta"],
  ["SI", "Slovenia"],
  ["HR", "Croazia"],
  ["GR", "Grecia"],
  ["PL", "Polonia"],
  ["RO", "Romania"],
  ["AL", "Albania"],
  ["US", "Stati Uniti"],
  ["CA", "Canada"],
  ["MX", "Messico"],
  ["BR", "Brasile"],
  ["AR", "Argentina"],
  ["AE", "Emirati Arabi Uniti"],
  ["CN", "Cina"],
  ["IN", "India"],
  ["AU", "Australia"],
];

export const nomePaese = (codice: string) => PAESI.find(([c]) => c === codice)?.[1] ?? codice;

export interface Sede {
  id: string;
  principale: boolean;
  paese: string;
  comune_codice: string | null;
  comune: string | null;
  sigla: string | null;
  provincia: string | null;
  provincia_slug: string | null;
  regione: string | null;
  citta_estera: string | null;
  indirizzo: string | null;
  fonte: FonteSede | null;
  da_completare: boolean;
}

export interface ComuneTrovato {
  codice: string;
  nome: string;
  nome_altro: string | null;
  sigla: string;
  provincia: string;
  regione: string;
  capoluogo: boolean;
}

// Testi geografici dell'agenzia, calcolati dal DB dalle sedi (aggiorna_testi_geo).
export interface TestiGeo {
  aree: string | null;
  citta: string | null;
  regioni: string | null;
}

const SELECT_SEDI = `
  id, principale, paese, comune_codice, citta_estera, indirizzo, fonte, created_at,
  comune:comuni(nome, sigla),
  provincia:areas!area_id(slug, nome, regione:areas!parent_id(nome))
`;

type RigaSede = {
  id: string;
  principale: boolean;
  paese: string;
  comune_codice: string | null;
  citta_estera: string | null;
  indirizzo: string | null;
  fonte: FonteSede | null;
  comune: { nome: string; sigla: string } | null;
  provincia: { slug: string; nome: string; regione: { nome: string } | null } | null;
};

export async function leggiSedi(
  supabase: SupabaseClient,
  agencyId: string,
): Promise<{ sedi: Sede[]; geo: TestiGeo } | { error: string }> {
  const [sedi, agenzia] = await Promise.all([
    supabase
      .from("agency_sedi")
      .select(SELECT_SEDI)
      .eq("agency_id", agencyId)
      .order("principale", { ascending: false })
      .order("created_at", { ascending: true })
      .returns<RigaSede[]>(),
    supabase.from("agencies").select("aree, citta, regioni").eq("id", agencyId).single(),
  ]);
  if (sedi.error) return { error: sedi.error.message };
  if (agenzia.error) return { error: agenzia.error.message };

  return {
    sedi: (sedi.data ?? []).map((r) => ({
      id: r.id,
      principale: r.principale,
      paese: r.paese,
      comune_codice: r.comune_codice,
      comune: r.comune?.nome ?? null,
      sigla: r.comune?.sigla ?? null,
      provincia: r.provincia?.nome ?? null,
      provincia_slug: r.provincia?.slug ?? null,
      regione: r.provincia?.regione?.nome ?? null,
      citta_estera: r.citta_estera,
      indirizzo: r.indirizzo,
      fonte: r.fonte,
      da_completare: r.paese === "IT" && !r.comune_codice,
    })),
    geo: agenzia.data as TestiGeo,
  };
}

// Errori del DB (vincoli e trigger) in italiano per la scheda.
export function messaggioErroreSede(err: { code?: string; message: string }): string {
  if (err.code === "23505" && err.message.includes("agency_sedi_comune_unico")) {
    return "Questa agenzia ha già una sede in quel comune.";
  }
  if (err.code === "23505" && err.message.includes("agency_sedi_una_principale")) {
    return "C'è già una sede principale.";
  }
  if (err.message.includes("agency_sedi_italia_o_estero")) {
    return "Per una sede in Italia serve il comune, per una sede all'estero la città.";
  }
  return err.message;
}

// Pulisce una stringa facoltativa: vuota → null.
export function testoOpzionale(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}
