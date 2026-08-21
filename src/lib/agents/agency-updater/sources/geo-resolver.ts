// Resolver geografico italiano.
// Input: Google formattedAddress → output: città + regione (display + slug) + area.
// Mappa statica sigle provincia → regione (110 province IT + soppresse).

const PROVINCE_TO_REGION: Record<string, string> = {
  AG: "Sicilia", AL: "Piemonte", AN: "Marche", AO: "Valle d'Aosta",
  AR: "Toscana", AP: "Marche", AT: "Piemonte", AV: "Campania",
  BA: "Puglia", BT: "Puglia", BL: "Veneto", BN: "Campania",
  BG: "Lombardia", BI: "Piemonte", BO: "Emilia-Romagna", BZ: "Trentino-Alto Adige",
  BS: "Lombardia", BR: "Puglia", CA: "Sardegna", CL: "Sicilia",
  CB: "Molise", CI: "Sardegna", CE: "Campania", CT: "Sicilia",
  CZ: "Calabria", CH: "Abruzzo", CO: "Lombardia", CS: "Calabria",
  CR: "Lombardia", KR: "Calabria", CN: "Piemonte", EN: "Sicilia",
  FM: "Marche", FE: "Emilia-Romagna", FI: "Toscana", FG: "Puglia",
  FC: "Emilia-Romagna", FR: "Lazio", GE: "Liguria", GO: "Friuli-Venezia Giulia",
  GR: "Toscana", IM: "Liguria", IS: "Molise", SP: "Liguria",
  AQ: "Abruzzo", LT: "Lazio", LE: "Puglia", LC: "Lombardia",
  LI: "Toscana", LO: "Lombardia", LU: "Toscana", MC: "Marche",
  MN: "Lombardia", MS: "Toscana", MT: "Basilicata", ME: "Sicilia",
  MI: "Lombardia", MO: "Emilia-Romagna", MB: "Lombardia", NA: "Campania",
  NO: "Piemonte", NU: "Sardegna", OG: "Sardegna", OT: "Sardegna",
  OR: "Sardegna", PD: "Veneto", PA: "Sicilia", PR: "Emilia-Romagna",
  PV: "Lombardia", PG: "Umbria", PU: "Marche", PE: "Abruzzo",
  PC: "Emilia-Romagna", PI: "Toscana", PT: "Toscana", PN: "Friuli-Venezia Giulia",
  PZ: "Basilicata", PO: "Toscana", RG: "Sicilia", RA: "Emilia-Romagna",
  RC: "Calabria", RE: "Emilia-Romagna", RI: "Lazio", RN: "Emilia-Romagna",
  RM: "Lazio", RO: "Veneto", SA: "Campania", SS: "Sardegna",
  SV: "Liguria", SI: "Toscana", SR: "Sicilia", SO: "Lombardia",
  SU: "Sardegna", TA: "Puglia", TE: "Abruzzo", TR: "Umbria",
  TO: "Piemonte", TP: "Sicilia", TN: "Trentino-Alto Adige", TV: "Veneto",
  TS: "Friuli-Venezia Giulia", UD: "Friuli-Venezia Giulia", VA: "Lombardia",
  VE: "Veneto", VB: "Piemonte", VC: "Piemonte", VR: "Veneto",
  VV: "Calabria", VI: "Veneto", VT: "Lazio",
};

export interface GeoResolved {
  city_display: string;
  region_display: string;
  province_code: string;
  citta_slug: string;
  regioni_slug: string;
  aree: string;              // "Regione>Città"
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Google formatted address IT patterns supportati:
//   "Via Roma, 12, 60121 Ancona AN, Italia"
//   "Corso Como 5, 20154 Milano MI"
//   "Via X, 10, 37053 Cerea VR"
//   "Piazza Duomo, 25121 Reggio Emilia RE, Italia"
//
// Cerchiamo la sequenza <CAP> <città> <PROV> ovunque nella stringa. Non
// richiediamo "Italia" a fine (Google spesso non lo mette). Validiamo PROV
// contro la mappa per filtrare falsi positivi.
const ADDRESS_RE = /(\d{5})\s+([^,]+?)\s+([A-Z]{2})(?=\s*(?:,|$|\s+(?:Italia|Italy|IT)\b))/;

// Fallback: <città> <PROV> senza CAP (raro), es. "Milano MI, Italia"
const ADDRESS_RE_NO_CAP = /(?:^|,\s*)([A-Za-zÀ-ÿ'\s]+?)\s+([A-Z]{2})\s*,?\s*(?:Italia|Italy|IT)\s*$/i;

function tryMatch(cleaned: string): { city: string; prov: string } | null {
  const withCap = cleaned.match(ADDRESS_RE);
  if (withCap) {
    return { city: withCap[2].trim(), prov: withCap[3].toUpperCase() };
  }
  const noCap = cleaned.match(ADDRESS_RE_NO_CAP);
  if (noCap) {
    return { city: noCap[1].trim(), prov: noCap[2].toUpperCase() };
  }
  return null;
}

export function resolveItalianAddress(address: string | null | undefined): GeoResolved | null {
  if (!address || typeof address !== "string") return null;

  const cleaned = address.trim().replace(/\s+/g, " ");
  const m = tryMatch(cleaned);
  if (!m) return null;
  if (!PROVINCE_TO_REGION[m.prov]) return null;

  const region = PROVINCE_TO_REGION[m.prov];
  return {
    city_display: m.city,
    region_display: region,
    province_code: m.prov,
    citta_slug: slugify(m.city),
    regioni_slug: slugify(region),
    aree: `${region}>${m.city}`,
  };
}
