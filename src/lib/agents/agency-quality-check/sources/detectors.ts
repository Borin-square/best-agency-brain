// Funzioni pure di detection per l'agente agency-quality-check.
// Ogni detector prende un AgencyRow (e opzionalmente il set di agenzie
// nello scope corrente per confronti cross-record) e ritorna:
//   - null: nessun problema rilevato
//   - DetectedIssue: descrizione strutturata del problema
//
// NIENTE side effect DB qui. Il write centralizzato è in run.ts.

export type IssueType =
  | "blacklist_domain"
  | "dup_place_id"
  | "dup_domain"
  | "dup_vat"
  | "dup_phone"
  | "fuzzy_title_dup"
  | "site_dead"
  | "empty_agency"
  | "test_placeholder"
  | "enrichment_failing";

export type IssueSeverity = "low" | "medium" | "high";

export interface DetectedIssue {
  type: IssueType;
  severity: IssueSeverity;
  evidence: Record<string, unknown>;
}

// Agenzia (input) per i detector. Manteniamo il minimo set di campi
// necessari — run.ts si occupa della SELECT.
export interface DetectorAgency {
  id: string;
  title: string | null;
  citta: string | null;
  sito_web: string | null;
  google_place_id: string | null;
  google_sito: string | null;
  partita_iva: string | null;
  telefono: string | null;
  google_telefono: string | null;
  email: string | null;
  enrichment_status: string | null;
  last_enriched_at: string | null;
  enrichment_errors: unknown | null;
  publish_status: string | null;
}

// -----------------------------------------------------------------------
// Blacklist domains: rooted-domain che NON possono essere sito ufficiale
// di un'agenzia (portali, social, hosting free, ecc.).
// -----------------------------------------------------------------------
export const BLACKLIST_DOMAINS = new Set<string>([
  "blogspot.com",
  "blogspot.it",
  "jobleads.com",
  "trabajo.org",
  "jobrapido.com",
  "indeed.com",
  "wordpress.com",
  "wixsite.com",
  "wix.com",
  "weebly.com",
  "webnode.it",
  "webnode.com",
  "sites.google.com",
  "facebook.com",
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "paginegialle.it",
  "pagineagialle.it",
  "trovaprezzi.it",
  "yelp.com",
  "yelp.it",
]);

// Regex per titoli placeholder / test.
const TEST_TITLE_REGEX = /^(test|asdf|xxx|prova|todo|placeholder|\d+)$/i;

// Email placeholder note.
const TEST_EMAIL_SET = new Set<string>([
  "test@test.com",
  "test@test.it",
  "foo@bar.com",
  "foo@bar.it",
  "prova@prova.com",
  "prova@prova.it",
  "admin@admin.com",
  "example@example.com",
  "noreply@example.com",
]);

// Stopwords rimosse per il fuzzy-match sui titoli.
const TITLE_STOPWORDS = new Set<string>([
  "agenzia",
  "agency",
  "studio",
  "srl",
  "spa",
  "sas",
  "snc",
  "srls",
  "s.r.l",
  "s.p.a",
  "s.a.s",
  "s.n.c",
  "the",
  "il",
  "la",
  "lo",
  "di",
  "e",
  "&",
]);

// -----------------------------------------------------------------------
// Utility helpers (pure)
// -----------------------------------------------------------------------

export function extractRootDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  let host: string;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    const u = new URL(withProto);
    host = u.hostname.toLowerCase();
  } catch {
    // Fallback: strip protocol/path a mano
    host = trimmed
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0];
  }
  host = host.replace(/^www\./, "");
  // Riduciamo ai due ultimi label (es. "shop.example.co.uk" → "co.uk"
  // rischia falso positivo; per l'IT-first del progetto la naive è ok).
  // Manteniamo la naive perché la blacklist è pensata su root banali
  // (facebook.com, wixsite.com, ecc.).
  return host || null;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let p = phone.trim();
  if (!p) return null;
  // Rimuovi tutto tranne cifre
  p = p.replace(/[^\d+]/g, "");
  // Uniforma prefisso +39 / 0039 / 39 iniziale (contesto IT).
  p = p.replace(/^\+?0*39/, "");
  p = p.replace(/^\+/, "");
  return p.length >= 6 ? p : null;
}

export function normalizeTitle(title: string | null | undefined): string {
  if (!title) return "";
  const lowered = title.toLowerCase();
  // Rimuovi punteggiatura, mantieni lettere/numeri/spazi
  const cleaned = lowered.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const tokens = cleaned.split(" ").filter((t) => t && !TITLE_STOPWORDS.has(t));
  return tokens.join(" ");
}

// Levenshtein distance (iterativa, O(n*m) memoria O(min(n,m))).
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  // Facciamo b la stringa più corta per la riga corrente.
  let s = a;
  let t = b;
  if (s.length < t.length) {
    const tmp = s;
    s = t;
    t = tmp;
  }
  let prev = new Array(t.length + 1);
  let curr = new Array(t.length + 1);
  for (let j = 0; j <= t.length; j++) prev[j] = j;
  for (let i = 1; i <= s.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const cost = s.charCodeAt(i - 1) === t.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost, // substitution
      );
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[t.length];
}

export function titleSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

// -----------------------------------------------------------------------
// Detectors (pure)
// -----------------------------------------------------------------------

export function detectBlacklistDomain(agency: DetectorAgency): DetectedIssue | null {
  const domain = extractRootDomain(agency.sito_web);
  if (!domain) return null;
  // Match esatto o suffisso (es. "www.wordpress.com" già stripped, ma
  // "sub.wixsite.com" → il root del subdomain è wixsite.com se strippiamo
  // solo www; qui manteniamo naive: matcha se il domain finisce con uno
  // dei blacklist)
  for (const bad of BLACKLIST_DOMAINS) {
    if (domain === bad || domain.endsWith(`.${bad}`)) {
      return {
        type: "blacklist_domain",
        severity: "high",
        evidence: { domain, matched_blacklist: bad },
      };
    }
  }
  return null;
}

export function detectDupPlaceId(
  agency: DetectorAgency,
  allAgenciesInScope: DetectorAgency[],
): DetectedIssue | null {
  if (!agency.google_place_id) return null;
  const others = allAgenciesInScope.filter(
    (a) =>
      a.id !== agency.id &&
      a.google_place_id === agency.google_place_id &&
      a.publish_status !== "trash",
  );
  if (others.length === 0) return null;
  return {
    type: "dup_place_id",
    severity: "high",
    evidence: {
      place_id: agency.google_place_id,
      other_agency_ids: others.map((o) => o.id),
    },
  };
}

export function detectDupDomain(
  agency: DetectorAgency,
  allAgenciesInScope: DetectorAgency[],
): DetectedIssue | null {
  const domain = extractRootDomain(agency.sito_web);
  if (!domain) return null;
  // Non triggerare dup_domain sui domini blacklist — quelli sono gestiti
  // da blacklist_domain (auto-trash) e sarebbero rumore.
  if (BLACKLIST_DOMAINS.has(domain)) return null;
  const others = allAgenciesInScope.filter((a) => {
    if (a.id === agency.id) return false;
    if (a.publish_status === "trash") return false;
    const otherDomain = extractRootDomain(a.sito_web);
    return otherDomain === domain;
  });
  if (others.length === 0) return null;
  return {
    type: "dup_domain",
    severity: "high",
    evidence: {
      domain,
      other_agency_ids: others.map((o) => o.id),
    },
  };
}

export function detectDupVat(
  agency: DetectorAgency,
  allAgenciesInScope: DetectorAgency[],
): DetectedIssue | null {
  const vat = agency.partita_iva?.trim();
  if (!vat) return null;
  const others = allAgenciesInScope.filter(
    (a) =>
      a.id !== agency.id &&
      a.partita_iva?.trim() === vat &&
      a.publish_status !== "trash",
  );
  if (others.length === 0) return null;
  return {
    type: "dup_vat",
    severity: "high",
    evidence: {
      vat,
      other_agency_ids: others.map((o) => o.id),
    },
  };
}

export function detectDupPhone(
  agency: DetectorAgency,
  allAgenciesInScope: DetectorAgency[],
): DetectedIssue | null {
  const phones = [agency.telefono, agency.google_telefono]
    .map(normalizePhone)
    .filter((p): p is string => !!p);
  if (phones.length === 0) return null;

  const matched: Array<{ agency_id: string; phone: string }> = [];
  for (const p of phones) {
    for (const a of allAgenciesInScope) {
      if (a.id === agency.id) continue;
      if (a.publish_status === "trash") continue;
      const otherPhones = [a.telefono, a.google_telefono]
        .map(normalizePhone)
        .filter((x): x is string => !!x);
      if (otherPhones.includes(p)) {
        matched.push({ agency_id: a.id, phone: p });
      }
    }
  }
  if (matched.length === 0) return null;
  // Dedup by agency_id
  const seen = new Set<string>();
  const others = matched.filter((m) => {
    if (seen.has(m.agency_id)) return false;
    seen.add(m.agency_id);
    return true;
  });
  return {
    type: "dup_phone",
    severity: "medium",
    evidence: {
      phone_normalized: phones[0],
      other_agency_ids: others.map((o) => o.agency_id),
    },
  };
}

export function detectFuzzyTitleDup(
  agency: DetectorAgency,
  allAgenciesInScope: DetectorAgency[],
  threshold = 0.85,
): DetectedIssue | null {
  const normA = normalizeTitle(agency.title);
  if (!normA || normA.length < 3) return null;
  if (!agency.citta) return null;

  let best: { id: string; similarity: number; title_b: string } | null = null;
  for (const other of allAgenciesInScope) {
    if (other.id === agency.id) continue;
    if (other.publish_status === "trash") continue;
    if (other.citta !== agency.citta) continue;
    const normB = normalizeTitle(other.title);
    if (!normB || normB.length < 3) continue;
    const sim = titleSimilarity(normA, normB);
    if (sim >= threshold && (!best || sim > best.similarity)) {
      best = { id: other.id, similarity: sim, title_b: other.title ?? "" };
    }
  }
  if (!best) return null;
  return {
    type: "fuzzy_title_dup",
    severity: "medium",
    evidence: {
      other_agency_id: best.id,
      similarity: Number(best.similarity.toFixed(3)),
      title_a: agency.title ?? "",
      title_b: best.title_b,
    },
  };
}

export function detectEmptyAgency(agency: DetectorAgency): DetectedIssue | null {
  const noSite = !agency.sito_web?.trim();
  const noPlace = !agency.google_place_id?.trim();
  const noEmail = !agency.email?.trim();
  const noPhone = !agency.telefono?.trim() && !agency.google_telefono?.trim();
  if (noSite && noPlace && noEmail && noPhone) {
    return {
      type: "empty_agency",
      severity: "medium",
      evidence: {},
    };
  }
  return null;
}

export function detectTestPlaceholder(agency: DetectorAgency): DetectedIssue | null {
  const title = agency.title?.trim() ?? "";
  if (title && TEST_TITLE_REGEX.test(title)) {
    return {
      type: "test_placeholder",
      severity: "high",
      evidence: { reason: "title_matches_test_regex", title },
    };
  }
  const email = agency.email?.trim().toLowerCase() ?? "";
  if (email && TEST_EMAIL_SET.has(email)) {
    return {
      type: "test_placeholder",
      severity: "high",
      evidence: { reason: "placeholder_email", email },
    };
  }
  return null;
}

export function detectEnrichmentFailing(agency: DetectorAgency): DetectedIssue | null {
  if (agency.enrichment_status !== "error") return null;
  if (!agency.last_enriched_at) return null;
  const last = new Date(agency.last_enriched_at).getTime();
  if (Number.isNaN(last)) return null;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (last < cutoff) return null; // già vecchio, non triggerare
  return {
    type: "enrichment_failing",
    severity: "low",
    evidence: {
      last_error: agency.enrichment_errors ?? null,
      last_enriched_at: agency.last_enriched_at,
    },
  };
}

// -----------------------------------------------------------------------
// Runner: raccoglie tutte le issue detectate per un'agenzia in un colpo.
// -----------------------------------------------------------------------
export function runAllDetectors(
  agency: DetectorAgency,
  allAgenciesInScope: DetectorAgency[],
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const push = (i: DetectedIssue | null) => {
    if (i) issues.push(i);
  };
  push(detectBlacklistDomain(agency));
  push(detectDupPlaceId(agency, allAgenciesInScope));
  push(detectDupDomain(agency, allAgenciesInScope));
  push(detectDupVat(agency, allAgenciesInScope));
  push(detectDupPhone(agency, allAgenciesInScope));
  push(detectFuzzyTitleDup(agency, allAgenciesInScope));
  push(detectEmptyAgency(agency));
  push(detectTestPlaceholder(agency));
  push(detectEnrichmentFailing(agency));
  return issues;
}
