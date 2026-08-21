// Dedup dei candidati contro il database corrente (scoped per domain_id).
// Match forte: dominio ufficiale identico.
// Match debole: nome normalizzato uguale → REVIEW_REQUIRED se dominio diverso.

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAgencyName, normalizeDomain } from "./domain";

export interface ExistingAgency {
  id: string;
  title: string;
  sito_web: string | null;
}

export interface DedupIndex {
  byDomain: Map<string, ExistingAgency>;
  byName: Map<string, ExistingAgency>;
}

export async function buildDedupIndex(
  supabase: SupabaseClient,
  domainId: string,
): Promise<DedupIndex> {
  const { data, error } = await supabase
    .from("agencies")
    .select("id, title, sito_web")
    .eq("domain_id", domainId)
    .limit(50000);
  if (error) throw new Error(`buildDedupIndex: ${error.message}`);

  const byDomain = new Map<string, ExistingAgency>();
  const byName = new Map<string, ExistingAgency>();
  for (const row of (data ?? []) as ExistingAgency[]) {
    const d = normalizeDomain(row.sito_web);
    if (d) byDomain.set(d, row);
    const n = normalizeAgencyName(row.title ?? "");
    if (n) byName.set(n, row);
  }
  return { byDomain, byName };
}

export type DedupOutcome =
  | { kind: "duplicate"; existing: ExistingAgency }
  | { kind: "review"; existing: ExistingAgency; reason: string }
  | { kind: "new" };

export function checkDedup(
  index: DedupIndex,
  candidateName: string,
  candidateDomain: string | null,
): DedupOutcome {
  if (candidateDomain) {
    const hit = index.byDomain.get(candidateDomain);
    if (hit) return { kind: "duplicate", existing: hit };
  }
  const nameKey = normalizeAgencyName(candidateName);
  if (nameKey) {
    const hit = index.byName.get(nameKey);
    if (hit) {
      const existingDomain = normalizeDomain(hit.sito_web);
      if (existingDomain && candidateDomain && existingDomain === candidateDomain) {
        return { kind: "duplicate", existing: hit };
      }
      return {
        kind: "review",
        existing: hit,
        reason: `Nome uguale ('${candidateName}') ma dominio diverso: candidate=${candidateDomain ?? "?"} vs db=${existingDomain ?? "?"}`,
      };
    }
  }
  return { kind: "new" };
}
