import type { SupabaseClient } from "@supabase/supabase-js";

export interface AgencySkill {
  id: string;
  domain_id: string;
  slug: string;
  label: string;
  sort_order: number;
}

export function slugifySkill(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function fetchAllowedSkills(
  supabase: SupabaseClient,
  domainId: string,
): Promise<AgencySkill[]> {
  const { data } = await supabase
    .from("agency_skills")
    .select("id, domain_id, slug, label, sort_order")
    .eq("domain_id", domainId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as AgencySkill[];
}

// Normalizza una stringa proveniente dall'LLM verso lo slug della allowlist.
// Match su slug esatto, poi su label case-insensitive, poi su slug ricavato.
// Torna null se non riconosciuta.
export function normalizeToSkill(raw: string, allowed: AgencySkill[]): string | null {
  const s = raw.trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  const bySlug = allowed.find((a) => a.slug === lower);
  if (bySlug) return bySlug.slug;
  const byLabel = allowed.find((a) => a.label.toLowerCase() === lower);
  if (byLabel) return byLabel.slug;
  const guessed = slugifySkill(s);
  const byGuess = allowed.find((a) => a.slug === guessed);
  if (byGuess) return byGuess.slug;
  return null;
}

// Filtra + dedup + tronca. Sempre restituisce array (mai null).
export function filterAndCap(
  raw: string[] | null | undefined,
  allowed: AgencySkill[],
  cap: number,
): string[] {
  if (!raw || raw.length === 0) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const slug = normalizeToSkill(item, allowed);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
    if (out.length >= cap) break;
  }
  return out;
}
