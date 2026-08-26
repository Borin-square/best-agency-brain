// Fallback scraping via Firecrawl (browser reale headless, bypassa WAF/Cloudflare).
// Usato quando il fetch nativo fallisce con http_error/timeout/too_little_text.
// Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape

import type { ScrapedSite } from "./website-scrape";
import { ScrapeError } from "./website-scrape";

const FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape";
const MAX_TEXT_CHARS = 20_000;
const TIMEOUT_MS = 45_000; // Firecrawl è più lento (headless browser)

interface FirecrawlSuccess {
  success: true;
  data: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
    };
  };
}

interface FirecrawlError {
  success: false;
  error?: string;
}

type FirecrawlResp = FirecrawlSuccess | FirecrawlError;

export function hasFirecrawl(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

export interface FirecrawlScrapeOptions {
  fullContent?: boolean; // true → onlyMainContent=false (utile per pagine elenco/directory)
  returnHtml?: boolean;  // true → richiedi anche formats:['html'] e usa quello come .text
}

// Restituisce anche l'HTML raw se richiesto (per parsing img tags / DOM).
export interface FirecrawlScrapeResult extends ScrapedSite {
  raw_html?: string;
}

export async function firecrawlScrape(
  url: string,
  opts: FirecrawlScrapeOptions = {},
): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new ScrapeError("no_firecrawl_key", "FIRECRAWL_API_KEY non configurata");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let res: Response;
    try {
      res = await fetch(FIRECRAWL_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: opts.returnHtml ? ["markdown", "html"] : ["markdown"],
          onlyMainContent: !opts.fullContent,
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ScrapeError(
        controller.signal.aborted ? "firecrawl_timeout" : "firecrawl_network_error",
        controller.signal.aborted
          ? `Firecrawl timeout dopo ${TIMEOUT_MS}ms su ${url}`
          : `Firecrawl: ${msg}`,
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ScrapeError(
        "firecrawl_http_error",
        `Firecrawl HTTP ${res.status}: ${body.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as FirecrawlResp;
    if (!data.success) {
      throw new ScrapeError(
        "firecrawl_scrape_failed",
        `Firecrawl error: ${data.error ?? "unknown"}`,
      );
    }

    const markdown = data.data.markdown?.trim() ?? "";
    if (markdown.length < 100) {
      throw new ScrapeError(
        "firecrawl_too_little_text",
        `Firecrawl ha ritornato solo ${markdown.length} char da ${url}`,
      );
    }

    return {
      url,
      final_url: data.data.metadata?.sourceURL ?? url,
      meta_title: data.data.metadata?.title ?? null,
      meta_description: data.data.metadata?.description ?? null,
      text: markdown.slice(0, MAX_TEXT_CHARS),
      bytes: markdown.length,
      raw_html: opts.returnHtml ? data.data.html : undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}
