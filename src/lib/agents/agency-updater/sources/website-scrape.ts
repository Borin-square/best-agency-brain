// Scrape del sito ufficiale dell'agenzia.
// Strategia a 2 livelli:
//   1. fetch HTML nativo con UA browser (0 costo, veloce)
//   2. fallback Firecrawl se native fallisce con bot-block/SPA/timeout
//      (costa ma bypassa WAF/Cloudflare, esegue JS)

const MAX_BYTES = 500_000; // 500KB HTML max — evita pagine enormi
const MAX_TEXT_CHARS = 20_000; // ~5k token, sufficiente per estrarre info aziendali
const TIMEOUT_MS = 15_000;

export interface ScrapedSite {
  url: string;
  final_url: string;
  meta_title: string | null;
  meta_description: string | null;
  text: string;
  bytes: number;
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

function extractMeta(html: string, name: "title" | "description"): string | null {
  if (name === "title") {
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? decodeEntities(m[1].trim()).slice(0, 300) : null;
  }
  const m = html.match(
    /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["']/i,
  );
  return m ? decodeEntities(m[1].trim()).slice(0, 500) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// UA di un browser reale: molti siti (Cloudflare, WAF vari) bloccano UA
// che contengono "bot", "crawler", ecc. Nessun rischio abuso: 1 request per agenzia.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Errori dettagliati per capire cosa è andato storto (visibili in enrichment_errors).
// Solleviamo Error così run.ts li cattura e li registra.
export class ScrapeError extends Error {
  constructor(public reason: string, message: string) {
    super(message);
    this.name = "ScrapeError";
  }
}

// Reason ScrapeError su cui vale la pena tentare Firecrawl come fallback.
// invalid_url e network_error (DNS/TLS) non hanno senso da riprovare.
const FIRECRAWL_FALLBACK_REASONS = new Set([
  "http_error",
  "timeout",
  "wrong_content_type",
  "empty_response",
  "too_little_text",
]);

export interface ScrapeResult extends ScrapedSite {
  source: "native" | "firecrawl";
}

export async function scrapeWebsite(rawUrl: string): Promise<ScrapeResult> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new ScrapeError("invalid_url", `URL non valido: ${rawUrl}`);

  try {
    const native = await nativeScrape(url);
    return { ...native, source: "native" };
  } catch (err) {
    if (!(err instanceof ScrapeError) || !FIRECRAWL_FALLBACK_REASONS.has(err.reason)) {
      throw err;
    }
    // Import dinamico per evitare ciclo (firecrawl-scrape importa ScrapeError da qui)
    const { firecrawlScrape, hasFirecrawl } = await import("./firecrawl-scrape");
    if (!hasFirecrawl()) {
      throw new ScrapeError(
        err.reason,
        `${err.message} — Firecrawl non configurato per fallback`,
      );
    }
    try {
      const fc = await firecrawlScrape(url);
      return { ...fc, source: "firecrawl" };
    } catch (fcErr) {
      const fcMsg = fcErr instanceof Error ? fcErr.message : String(fcErr);
      throw new ScrapeError(
        "firecrawl_fallback_failed",
        `Native: ${err.message} | Firecrawl: ${fcMsg}`,
      );
    }
  }
}

async function nativeScrape(url: string): Promise<ScrapedSite> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": BROWSER_UA,
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "accept-language": "it-IT,it;q=0.9,en;q=0.8",
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ScrapeError(
        controller.signal.aborted ? "timeout" : "network_error",
        controller.signal.aborted ? `Timeout dopo ${TIMEOUT_MS}ms su ${url}` : `${msg} (${url})`,
      );
    }

    if (!res.ok) {
      throw new ScrapeError("http_error", `HTTP ${res.status} da ${url}`);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html") && !ct.includes("xml") && !ct.includes("text")) {
      throw new ScrapeError("wrong_content_type", `Content-Type non-HTML: ${ct} (${url})`);
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new ScrapeError("empty_response", `Body vuoto da ${url}`);
    }
    const truncated = buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(truncated);

    const text = htmlToText(html).slice(0, MAX_TEXT_CHARS);
    if (text.length < 100) {
      throw new ScrapeError(
        "too_little_text",
        `Solo ${text.length} char di testo utile da ${url} (probabile SPA o pagina vuota)`,
      );
    }

    return {
      url,
      final_url: res.url,
      meta_title: extractMeta(html, "title"),
      meta_description: extractMeta(html, "description"),
      text,
      bytes: buffer.byteLength,
    };
  } finally {
    clearTimeout(timer);
  }
}
