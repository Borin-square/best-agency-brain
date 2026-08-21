// Firecrawl Search API — restituisce risultati SERP per una query.
// Docs: https://docs.firecrawl.dev/features/search
// Endpoint: POST https://api.firecrawl.dev/v1/search
// Body: { query, limit, lang, country }

const FIRECRAWL_SEARCH_URL = "https://api.firecrawl.dev/v1/search";
const TIMEOUT_MS = 30_000;

export interface SearchHit {
  url: string;
  title: string;
  description: string;
}

interface FirecrawlSearchResp {
  success: boolean;
  data?: Array<{ url?: string; title?: string; description?: string }>;
  error?: string;
}

export async function firecrawlSearch(
  query: string,
  opts: { limit?: number; lang?: string; country?: string } = {},
): Promise<SearchHit[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(FIRECRAWL_SEARCH_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        limit: opts.limit ?? 10,
        lang: opts.lang ?? "it",
        country: opts.country ?? "it",
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Firecrawl search HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as FirecrawlSearchResp;
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(`Firecrawl search fallita: ${data.error ?? "unknown"}`);
    }
    return data.data
      .filter((r): r is { url: string; title?: string; description?: string } => Boolean(r.url))
      .map((r) => ({
        url: r.url,
        title: r.title ?? "",
        description: r.description ?? "",
      }));
  } finally {
    clearTimeout(timer);
  }
}
