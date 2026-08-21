// Scrape leggero del sito ufficiale dell'agenzia.
// Fetch HTML nativo → rimozione script/style/tag → testo pulito troncato.
// Nessuna dipendenza esterna: se in futuro serve rendering JS si può passare a Firecrawl.

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

export async function scrapeWebsite(rawUrl: string): Promise<ScrapedSite | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MiglioreAgenziaBot/1.0; +https://miglioreagenzia.it)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) return null;

    const buffer = await res.arrayBuffer();
    const truncated = buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(truncated);

    const text = htmlToText(html).slice(0, MAX_TEXT_CHARS);
    if (text.length < 100) return null;

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
