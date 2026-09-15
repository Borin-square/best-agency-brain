// Google Places API (New) — Text Search
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
//
// Strategia:
//   1. Query = SOLO nome agenzia (aggiungere la città in query peggiora il matching)
//   2. Chiediamo top 5 risultati
//   3. Se un risultato ha websiteUri con dominio uguale ad agency.sito_web → match forte (conf 1.0)
//   4. Altrimenti pick il best per similarity dei nomi (soglia 0.9 minima) E la città deve
//      comparire nel formattedAddress. Il domain match è considerato più affidabile della
//      città in DB e non richiede il city-check.

export interface PlacesResult {
  place_id: string;
  display_name: string;
  rating: number | null;
  reviews_count: number | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  category: string | null;
  photo_name: string | null;         // formato: "places/{id}/photos/{ref}"
  match_confidence: number;          // 0-1 (1 = dominio matcha esattamente)
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.types",
  "places.photos.name",
].join(",");

const MIN_ACCEPTABLE_SIMILARITY = 0.9;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?a\.?s\.?|s\.?n\.?c\.?|agenzia|agency|studio|the|di|il|la)\b/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGeneric(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addressMatchesCity(address: string | null | undefined, city: string | null | undefined): boolean {
  if (!address || !city) return false;
  const c = normalizeGeneric(city);
  if (!c) return false;
  const a = normalizeGeneric(address);
  const re = new RegExp(`(^|\\s)${c.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(\\s|$)`);
  return re.test(a);
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.startsWith(nb) || nb.startsWith(na)) return 0.9;
  const tokensA = new Set(na.split(" ").filter(Boolean));
  const tokensB = new Set(nb.split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return Number((intersection / union).toFixed(2));
}

function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

interface PlaceApiItem {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  types?: string[];
  photos?: Array<{ name: string }>;
}

function toResult(p: PlaceApiItem, name: string, confidence: number): PlacesResult {
  const displayName = p.displayName?.text ?? "";
  const category =
    p.types?.find((t) => t !== "point_of_interest" && t !== "establishment") ?? p.types?.[0] ?? null;
  return {
    place_id: p.id,
    display_name: displayName,
    rating: p.rating ?? null,
    reviews_count: p.userRatingCount ?? null,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    address: p.formattedAddress ?? null,
    website: p.websiteUri ?? null,
    category,
    photo_name: p.photos?.[0]?.name ?? null,
    match_confidence: confidence,
  };
}

/**
 * Trova il place più affidabile per un'agenzia.
 * @param name       nome ufficiale (usato come query)
 * @param website    sito ufficiale dell'agenzia — usato per validare il match via dominio
 * @param city       città dell'agenzia — usata come check post-match SOLO sul fallback nome
 *                   (il domain match è considerato più affidabile e non richiede city-check)
 * @returns PlacesResult se trovato con domain match, o (nome ≥ 0.9 E città combacia); altrimenti null
 */
export async function findPlace(
  name: string,
  website: string | null,
  city: string | null = null,
): Promise<PlacesResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY missing");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: name,
      languageCode: "it",
      regionCode: "IT",
      pageSize: 5, // più candidati per validare via dominio
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { places?: PlaceApiItem[] };
  const places = data.places ?? [];
  if (places.length === 0) return null;

  const wantDomain = domainOf(website);

  // 1. Cerca match forte via dominio
  if (wantDomain) {
    const domainMatch = places.find((p) => domainOf(p.websiteUri) === wantDomain);
    if (domainMatch) return toResult(domainMatch, name, 1);
  }

  // 2. Fallback: best similarity — accetta solo se >= 0.9 E la città combacia
  //    con formattedAddress (city presente in DB obbligatoria per accettare).
  //    Se city manca in DB, il fallback nome viene rifiutato per prudenza.
  if (!city) return null;

  let bestPlace: PlaceApiItem | null = null;
  let bestConf = 0;
  for (const p of places) {
    const conf = similarity(name, p.displayName?.text ?? "");
    if (conf > bestConf && addressMatchesCity(p.formattedAddress, city)) {
      bestConf = conf;
      bestPlace = p;
    }
  }
  if (!bestPlace || bestConf < MIN_ACCEPTABLE_SIMILARITY) return null;
  return toResult(bestPlace, name, bestConf);
}
