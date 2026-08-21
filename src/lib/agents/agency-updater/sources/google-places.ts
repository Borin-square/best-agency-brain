// Placeholder: Google Places API lookup by name + city
// Da completare con API key attiva

export interface PlacesResult {
  place_id: string;
  rating: number | null;
  reviews_count: number | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function findPlace(name: string, city: string): Promise<PlacesResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  // TODO: chiamata a Places API Text Search + Details
  void name;
  void city;
  return null;
}
