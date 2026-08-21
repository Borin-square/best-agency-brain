// Google Places API (New) — Text Search
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
//
// Cerca l'agenzia per "title + città" e ritorna il primo match + confidence.

export interface PlacesResult {
  place_id: string;
  display_name: string;
  rating: number | null;
  reviews_count: number | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  category: string | null;
  photo_name: string | null;         // formato: "places/{id}/photos/{ref}" — URL costruibile on-demand
  match_confidence: number;          // 0-1 basato su similarità token
}

// FieldMask: paghi solo per i campi richiesti (tier Essentials + Pro)
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

// Jaccard similarity su token, con boost se una stringa è prefisso/contiene l'altra.
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

export async function findPlace(
  name: string,
  city: string | null,
): Promise<PlacesResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY missing");

  const query = city ? `${name} ${city}` : name;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "it",
      regionCode: "IT",
      pageSize: 1,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { places?: PlaceApiItem[] };
  if (!data.places || data.places.length === 0) return null;

  const p = data.places[0];
  const displayName = p.displayName?.text ?? "";
  const category = p.types?.find((t) => t !== "point_of_interest" && t !== "establishment")
    ?? p.types?.[0]
    ?? null;

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
    match_confidence: similarity(name, displayName),
  };
}
