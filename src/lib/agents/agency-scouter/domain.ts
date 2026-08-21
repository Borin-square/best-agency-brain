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

// Domini da SEMPRE escludere come "sito ufficiale" (social, directory, aggregatori).
const NON_OFFICIAL_HOSTS = new Set([
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "tiktok.com",
  "behance.net",
  "dribbble.com",
  "vimeo.com",
  "medium.com",
  "wordpress.com",
  "wixsite.com",
  "clutch.co",
  "sortlist.com",
  "goodfirms.co",
  "designrush.com",
  "agenziecomunicazione.it",
  "miglioreagenzia.it",
  "google.com",
  "wikipedia.org",
]);

export function isDirectoryOrSocialDomain(domain: string | null): boolean {
  if (!domain) return true;
  return NON_OFFICIAL_HOSTS.has(domain) || domain.endsWith(".wordpress.com") || domain.endsWith(".wixsite.com");
}
