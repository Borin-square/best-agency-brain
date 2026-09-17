// DataForSEO Keywords Data — Google Ads Search Volume Live.
// Docs: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/
//
// Ritorna search_volume + cpc per lista keyword (fino a 1000 per task).
// Auth: Basic (base64(login:password)) — stesse env di dataforseo.ts.

const API_URL =
  "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live";
const LOCATION_CODE_ITALY = 2380;
const LANGUAGE_CODE_IT = "it";
const MAX_KEYWORDS_PER_TASK = 1000;

export interface KeywordVolumeResult {
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
}

interface DfsVolumeItem {
  keyword?: string;
  search_volume?: number | null;
  cpc?: number | null;
}

interface DfsTask {
  status_code: number;
  status_message: string;
  result?: DfsVolumeItem[] | null;
}

interface DfsResponse {
  status_code: number;
  status_message: string;
  tasks?: DfsTask[];
}

/**
 * Recupera search_volume + cpc per una lista di keyword.
 * Chunk automatico a MAX_KEYWORDS_PER_TASK per task, un POST per chunk.
 * Ritorna una mappa keyword (lowercase trimmed) → risultato.
 */
export async function fetchKeywordVolumeBatch(
  keywords: string[],
): Promise<Map<string, KeywordVolumeResult>> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD missing");
  }
  const out = new Map<string, KeywordVolumeResult>();
  if (keywords.length === 0) return out;

  const dedup = Array.from(new Set(keywords.map((k) => k.trim()).filter(Boolean)));
  const auth = Buffer.from(`${login}:${password}`).toString("base64");

  for (let i = 0; i < dedup.length; i += MAX_KEYWORDS_PER_TASK) {
    const chunk = dedup.slice(i, i + MAX_KEYWORDS_PER_TASK);
    const body = [
      {
        keywords: chunk,
        language_code: LANGUAGE_CODE_IT,
        location_code: LOCATION_CODE_ITALY,
      },
    ];

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as DfsResponse;
    if (json.status_code >= 40000) {
      throw new Error(`API error ${json.status_code}: ${json.status_message}`);
    }

    const task = json.tasks?.[0];
    if (!task || task.status_code >= 40000) continue;

    for (const item of task.result ?? []) {
      if (!item.keyword) continue;
      const key = item.keyword.trim().toLowerCase();
      out.set(key, {
        keyword: item.keyword,
        search_volume:
          typeof item.search_volume === "number" ? item.search_volume : null,
        cpc: typeof item.cpc === "number" ? item.cpc : null,
      });
    }
  }

  return out;
}
