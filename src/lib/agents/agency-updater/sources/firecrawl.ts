// Placeholder: scraping sito ufficiale dell'agenzia via Firecrawl API
// Da implementare una volta confermate colonne del foglio e API key attiva

export interface FirecrawlResult {
  markdown: string | null;
  meta_title: string | null;
  meta_description: string | null;
  links: string[];
}

export async function scrapeWebsite(url: string): Promise<FirecrawlResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  // TODO: chiamata a https://api.firecrawl.dev/v1/scrape
  void url;
  return null;
}
