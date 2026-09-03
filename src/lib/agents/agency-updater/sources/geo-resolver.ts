// Resolver geografico italiano.
// Input: Google formattedAddress → output: provincia + regione (display + slug) + area.
// Mappa statica 110 sigle provincia → { nome provincia, regione }.
// NB: il campo "citta" nel DB viene popolato con il NOME DELLA PROVINCIA
// (non del comune) — l'utente vuole aggregare per provincia per evitare
// dispersione su migliaia di paesini nella matrice/filtri.

interface ProvinceInfo {
  name: string;
  region: string;
}

const PROVINCES: Record<string, ProvinceInfo> = {
  AG: { name: "Agrigento",           region: "Sicilia" },
  AL: { name: "Alessandria",         region: "Piemonte" },
  AN: { name: "Ancona",              region: "Marche" },
  AO: { name: "Aosta",               region: "Valle d'Aosta" },
  AR: { name: "Arezzo",              region: "Toscana" },
  AP: { name: "Ascoli Piceno",       region: "Marche" },
  AT: { name: "Asti",                region: "Piemonte" },
  AV: { name: "Avellino",            region: "Campania" },
  BA: { name: "Bari",                region: "Puglia" },
  BT: { name: "Barletta-Andria-Trani", region: "Puglia" },
  BL: { name: "Belluno",             region: "Veneto" },
  BN: { name: "Benevento",           region: "Campania" },
  BG: { name: "Bergamo",             region: "Lombardia" },
  BI: { name: "Biella",              region: "Piemonte" },
  BO: { name: "Bologna",             region: "Emilia-Romagna" },
  BZ: { name: "Bolzano",             region: "Trentino-Alto Adige" },
  BS: { name: "Brescia",             region: "Lombardia" },
  BR: { name: "Brindisi",            region: "Puglia" },
  CA: { name: "Cagliari",            region: "Sardegna" },
  CL: { name: "Caltanissetta",       region: "Sicilia" },
  CB: { name: "Campobasso",          region: "Molise" },
  CI: { name: "Sud Sardegna",        region: "Sardegna" }, // ex Carbonia-Iglesias, soppressa 2016 → SU
  CE: { name: "Caserta",             region: "Campania" },
  CT: { name: "Catania",             region: "Sicilia" },
  CZ: { name: "Catanzaro",           region: "Calabria" },
  CH: { name: "Chieti",              region: "Abruzzo" },
  CO: { name: "Como",                region: "Lombardia" },
  CS: { name: "Cosenza",             region: "Calabria" },
  CR: { name: "Cremona",             region: "Lombardia" },
  KR: { name: "Crotone",             region: "Calabria" },
  CN: { name: "Cuneo",               region: "Piemonte" },
  EN: { name: "Enna",                region: "Sicilia" },
  FM: { name: "Fermo",               region: "Marche" },
  FE: { name: "Ferrara",             region: "Emilia-Romagna" },
  FI: { name: "Firenze",             region: "Toscana" },
  FG: { name: "Foggia",              region: "Puglia" },
  FC: { name: "Forlì-Cesena",        region: "Emilia-Romagna" },
  FR: { name: "Frosinone",           region: "Lazio" },
  GE: { name: "Genova",              region: "Liguria" },
  GO: { name: "Gorizia",             region: "Friuli-Venezia Giulia" },
  GR: { name: "Grosseto",            region: "Toscana" },
  IM: { name: "Imperia",             region: "Liguria" },
  IS: { name: "Isernia",             region: "Molise" },
  SP: { name: "La Spezia",           region: "Liguria" },
  AQ: { name: "L'Aquila",            region: "Abruzzo" },
  LT: { name: "Latina",              region: "Lazio" },
  LE: { name: "Lecce",               region: "Puglia" },
  LC: { name: "Lecco",               region: "Lombardia" },
  LI: { name: "Livorno",             region: "Toscana" },
  LO: { name: "Lodi",                region: "Lombardia" },
  LU: { name: "Lucca",               region: "Toscana" },
  MC: { name: "Macerata",            region: "Marche" },
  MN: { name: "Mantova",             region: "Lombardia" },
  MS: { name: "Massa-Carrara",       region: "Toscana" },
  MT: { name: "Matera",              region: "Basilicata" },
  ME: { name: "Messina",             region: "Sicilia" },
  MI: { name: "Milano",              region: "Lombardia" },
  MO: { name: "Modena",              region: "Emilia-Romagna" },
  MB: { name: "Monza e Brianza",     region: "Lombardia" },
  NA: { name: "Napoli",              region: "Campania" },
  NO: { name: "Novara",              region: "Piemonte" },
  NU: { name: "Nuoro",               region: "Sardegna" },
  OG: { name: "Nuoro",               region: "Sardegna" }, // ex Ogliastra, soppressa 2016 → NU
  OT: { name: "Sassari",             region: "Sardegna" }, // ex Olbia-Tempio, soppressa 2016 → SS
  OR: { name: "Oristano",            region: "Sardegna" },
  PD: { name: "Padova",              region: "Veneto" },
  PA: { name: "Palermo",             region: "Sicilia" },
  PR: { name: "Parma",               region: "Emilia-Romagna" },
  PV: { name: "Pavia",               region: "Lombardia" },
  PG: { name: "Perugia",             region: "Umbria" },
  PU: { name: "Pesaro e Urbino",     region: "Marche" },
  PE: { name: "Pescara",             region: "Abruzzo" },
  PC: { name: "Piacenza",            region: "Emilia-Romagna" },
  PI: { name: "Pisa",                region: "Toscana" },
  PT: { name: "Pistoia",             region: "Toscana" },
  PN: { name: "Pordenone",           region: "Friuli-Venezia Giulia" },
  PZ: { name: "Potenza",             region: "Basilicata" },
  PO: { name: "Prato",               region: "Toscana" },
  RG: { name: "Ragusa",              region: "Sicilia" },
  RA: { name: "Ravenna",             region: "Emilia-Romagna" },
  RC: { name: "Reggio Calabria",     region: "Calabria" },
  RE: { name: "Reggio Emilia",       region: "Emilia-Romagna" },
  RI: { name: "Rieti",               region: "Lazio" },
  RN: { name: "Rimini",              region: "Emilia-Romagna" },
  RM: { name: "Roma",                region: "Lazio" },
  RO: { name: "Rovigo",              region: "Veneto" },
  SA: { name: "Salerno",             region: "Campania" },
  SS: { name: "Sassari",             region: "Sardegna" },
  SV: { name: "Savona",              region: "Liguria" },
  SI: { name: "Siena",               region: "Toscana" },
  SR: { name: "Siracusa",            region: "Sicilia" },
  SO: { name: "Sondrio",             region: "Lombardia" },
  SU: { name: "Sud Sardegna",        region: "Sardegna" },
  TA: { name: "Taranto",             region: "Puglia" },
  TE: { name: "Teramo",              region: "Abruzzo" },
  TR: { name: "Terni",               region: "Umbria" },
  TO: { name: "Torino",              region: "Piemonte" },
  TP: { name: "Trapani",             region: "Sicilia" },
  TN: { name: "Trento",              region: "Trentino-Alto Adige" },
  TV: { name: "Treviso",             region: "Veneto" },
  TS: { name: "Trieste",             region: "Friuli-Venezia Giulia" },
  UD: { name: "Udine",               region: "Friuli-Venezia Giulia" },
  VA: { name: "Varese",              region: "Lombardia" },
  VE: { name: "Venezia",             region: "Veneto" },
  VB: { name: "Verbano-Cusio-Ossola", region: "Piemonte" },
  VC: { name: "Vercelli",            region: "Piemonte" },
  VR: { name: "Verona",              region: "Veneto" },
  VV: { name: "Vibo Valentia",       region: "Calabria" },
  VI: { name: "Vicenza",             region: "Veneto" },
  VT: { name: "Viterbo",             region: "Lazio" },
};

export interface GeoResolved {
  province_display: string;   // "Ancona"
  region_display: string;     // "Marche"
  province_code: string;      // "AN"
  citta_slug: string;         // "ancona"  (era il comune, ora è la provincia)
  regioni_slug: string;       // "marche"
  aree: string;               // "Marche>Ancona"
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

function tryMatch(cleaned: string): { prov: string } | null {
  const withCap = cleaned.match(ADDRESS_RE);
  if (withCap) return { prov: withCap[3].toUpperCase() };
  const noCap = cleaned.match(ADDRESS_RE_NO_CAP);
  if (noCap) return { prov: noCap[2].toUpperCase() };
  return null;
}

export function resolveItalianAddress(address: string | null | undefined): GeoResolved | null {
  if (!address || typeof address !== "string") return null;

  const cleaned = address.trim().replace(/\s+/g, " ");
  const m = tryMatch(cleaned);
  if (!m) return null;

  const info = PROVINCES[m.prov];
  if (!info) return null;

  return {
    province_display: info.name,
    region_display: info.region,
    province_code: m.prov,
    citta_slug: slugify(info.name),
    regioni_slug: slugify(info.region),
    aree: `${info.region}>${info.name}`,
  };
}
