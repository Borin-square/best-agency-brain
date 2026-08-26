// Fetch HTML raw + estrazione immagini (img, og:image, JSON-LD Organization.logo).
// A differenza di scrapeWebsite (che strippa i tag), qui teniamo l'HTML per parsing DOM-like via regex.
// Strategia 2 livelli: nativo → fallback Firecrawl (con formats:['html']) se native fallisce.

import { absoluteUrl, cleanUrl } from "../utils";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const TIMEOUT_MS = 15_000;
const MAX_HTML = 800_000;

export interface FetchedPage {
  final_url: string;
  html: string;
  images: ExtractedImage[];
  og_image: string | null;
  json_ld_logo: string | null;
  links_internal: Array<{ href: string; text: string }>;
}

export interface ExtractedImage {
  src: string;
  alt: string | null;
  in_header: boolean;
  in_footer: boolean;
  in_nav: boolean;
  surrounding_text: string | null; // ~100 char di contesto (per team detection)
}

export interface FetchOutcome {
  page: FetchedPage | null;
  source: "native" | "firecrawl" | "failed";
  error: string | null;
}

async function nativeFetch(url: string): Promise<FetchedPage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": BROWSER_UA,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html") && !ct.includes("xml")) throw new Error(`content-type: ${ct}`);
    const buffer = await res.arrayBuffer();
    const truncated = buffer.byteLength > MAX_HTML ? buffer.slice(0, MAX_HTML) : buffer;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(truncated);
    return parseHtml(res.url, html);
  } finally {
    clearTimeout(timer);
  }
}

// Retry via Firecrawl con HTML raw se native fallisce (WAF/Cloudflare/SPA).
async function firecrawlFetch(url: string): Promise<FetchedPage | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  const { firecrawlScrape } = await import("../../agency-updater/sources/firecrawl-scrape");
  try {
    const result = await firecrawlScrape(url, { fullContent: true, returnHtml: true });
    const html = result.raw_html;
    if (!html || html.length < 100) return null;
    return parseHtml(result.final_url, html);
  } catch {
    return null;
  }
}

// Backward-compat: mantiene la firma originale ma internamente usa fetchPageWithFallback.
export async function fetchPage(url: string): Promise<FetchedPage | null> {
  const out = await fetchPageWithFallback(url);
  return out.page;
}

export async function fetchPageWithFallback(url: string): Promise<FetchOutcome> {
  let nativeErr: string | null = null;
  try {
    const p = await nativeFetch(url);
    if (p) return { page: p, source: "native", error: null };
  } catch (err) {
    nativeErr = err instanceof Error ? err.message : String(err);
  }
  const fc = await firecrawlFetch(url);
  if (fc) return { page: fc, source: "firecrawl", error: nativeErr };
  return {
    page: null,
    source: "failed",
    error: nativeErr ?? "fetch fallito (native + firecrawl)",
  };
}

// ---- Parsing HTML via regex (no dep). Robusto abbastanza per un MVP. ----

function extractSection(html: string, tag: "header" | "footer" | "nav"): string {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const parts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) parts.push(m[1]);
  return parts.join(" ");
}

function extractOgImage(html: string): string | null {
  const m = html.match(
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i,
  );
  return m ? m[1] : null;
}

function extractJsonLdLogo(html: string): string | null {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!scripts) return null;
  for (const s of scripts) {
    const bodyMatch = s.match(/>([\s\S]*)</);
    if (!bodyMatch) continue;
    try {
      const parsed = JSON.parse(bodyMatch[1]);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of arr) {
        if (!node || typeof node !== "object") continue;
        const logo = (node as Record<string, unknown>).logo;
        if (typeof logo === "string") return logo;
        if (logo && typeof logo === "object" && typeof (logo as Record<string, unknown>).url === "string") {
          return (logo as Record<string, string>).url;
        }
      }
    } catch {}
  }
  return null;
}

function extractImages(
  baseUrl: string,
  html: string,
  headerHtml: string,
  footerHtml: string,
  navHtml: string,
): ExtractedImage[] {
  const found: ExtractedImage[] = [];
  const re = /<img\b([^>]+)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    if (!srcMatch) continue;
    const rawSrc = srcMatch[1].trim();
    if (rawSrc.startsWith("data:")) continue; // niente base64
    const abs = absoluteUrl(baseUrl, rawSrc);
    if (!abs) continue;
    const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1].trim() : null;

    // Contesto: la sezione html che contiene questo tag (approssima)
    const in_header = headerHtml.includes(m[0]);
    const in_footer = footerHtml.includes(m[0]);
    const in_nav = navHtml.includes(m[0]);

    // Testo circostante (200 char prima+dopo, stripped)
    const idx = m.index;
    const around = html.slice(Math.max(0, idx - 200), Math.min(html.length, idx + 200));
    const surrounding_text = around
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200) || null;

    found.push({
      src: cleanUrl(abs),
      alt,
      in_header,
      in_footer,
      in_nav,
      surrounding_text,
    });
  }
  return found;
}

function extractLinks(baseUrl: string, html: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const abs = absoluteUrl(baseUrl, href);
    if (!abs) continue;
    try {
      const u = new URL(abs);
      if (u.hostname !== base.hostname) continue; // solo interni
      const text = m[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      links.push({ href: abs, text });
    } catch {}
  }
  return links;
}

function parseHtml(finalUrl: string, html: string): FetchedPage {
  const header = extractSection(html, "header");
  const footer = extractSection(html, "footer");
  const nav = extractSection(html, "nav");
  return {
    final_url: finalUrl,
    html,
    images: extractImages(finalUrl, html, header, footer, nav),
    og_image: extractOgImage(html),
    json_ld_logo: extractJsonLdLogo(html),
    links_internal: extractLinks(finalUrl, html),
  };
}

// Cerca link "team/about/chi siamo/people/studio" tra i link interni.
const TEAM_LINK_KEYWORDS = [
  "team",
  "chi siamo",
  "chi-siamo",
  "about",
  "about us",
  "about-us",
  "people",
  "studio",
  "agenzia",
  "who we are",
];

export function findTeamPageLinks(links: Array<{ href: string; text: string }>): string[] {
  const scored = new Map<string, number>();
  for (const l of links) {
    const t = l.text.toLowerCase();
    const h = l.href.toLowerCase();
    for (const kw of TEAM_LINK_KEYWORDS) {
      if (t === kw) scored.set(l.href, Math.max(scored.get(l.href) ?? 0, 3));
      else if (t.includes(kw)) scored.set(l.href, Math.max(scored.get(l.href) ?? 0, 2));
      else if (h.includes(kw.replace(/\s+/g, "-"))) scored.set(l.href, Math.max(scored.get(l.href) ?? 0, 1));
    }
  }
  return Array.from(scored.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([url]) => url)
    .slice(0, 2);
}
