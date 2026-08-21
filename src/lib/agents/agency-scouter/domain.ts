// Normalizzazione URL + estrazione dominio per dedup.
// "https://www.Agenzia.it/services?utm_source=x" → "agenzia.it"

export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    // Rimuovi utm/ref query e fragment
    return `${u.protocol}//${u.hostname}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

export function normalizeDomain(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Normalizzazione nome agenzia per confronto (ignora case, punteggiatura, forme societarie).
export function normalizeAgencyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?a\.?s\.?|s\.?n\.?c\.?|ltd|llc|gmbh|inc|corp|ag|bv|oy|nv|agenzia|agency|studio|the|di|il|la)\b/gi,
      "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Nomi (senza TLD) di aggregatori/social/directory: matchiamo su qualsiasi TLD
// così sortlist.com, sortlist.es, sortlist.it sono tutti bloccati.
const NON_OFFICIAL_BASE_NAMES = new Set([
  "linkedin",
  "instagram",
  "facebook",
  "twitter",
  "x", // x.com
  "youtube",
  "tiktok",
  "behance",
  "dribbble",
  "vimeo",
  "medium",
  "clutch",
  "sortlist",
  "goodfirms",
  "designrush",
  "agenciasdemarketing",
  "agenziecomunicazione",
  "miglioreagenzia",
  "mejoragencia",
  "meilleureagence",
  "besteragentur",
  "google",
  "wikipedia",
  "yelp",
  "trustpilot",
  "glassdoor",
  "indeed",
  "crunchbase",
  "yellowpages",
  "paginegialle",
  "manta",
]);

// Sottodomini hostati (mai domini ufficiali di agenzie).
const HOSTED_SUFFIXES = [
  ".wordpress.com",
  ".wixsite.com",
  ".webflow.io",
  ".vercel.app",
  ".netlify.app",
  ".github.io",
  ".blogspot.com",
  ".squarespace.com",
];

export function isDirectoryOrSocialDomain(domain: string | null): boolean {
  if (!domain) return true;
  const d = domain.toLowerCase();
  for (const suf of HOSTED_SUFFIXES) if (d.endsWith(suf)) return true;
  // Prendi il primo label (nome brand): "sortlist.es" → "sortlist"
  const baseName = d.split(".")[0];
  if (NON_OFFICIAL_BASE_NAMES.has(baseName)) return true;
  return false;
}
