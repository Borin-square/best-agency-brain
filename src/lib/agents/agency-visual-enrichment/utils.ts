// Utility per visual enrichment: slug, estensioni, mime, filename.

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(
      /\b(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?a\.?s\.?|s\.?n\.?c\.?|ltd|llc|gmbh|inc|corp)\b/gi,
      "",
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/avif": "avif",
};

export function extFromMime(mime: string | null | undefined): string | null {
  if (!mime) return null;
  const norm = mime.toLowerCase().split(";")[0].trim();
  return EXT_BY_MIME[norm] ?? null;
}

export function extFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const m = path.match(/\.([a-z0-9]{2,4})(?:$|\?)/i);
    if (!m) return null;
    const ext = m[1].toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "svg", "gif", "ico", "avif"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  } catch {}
  return null;
}

// Short 4-char hex hash da URL o buffer, usato per disambiguare file con stesso slug.
export function shortHash(input: string | ArrayBuffer): string {
  let hash = 5381;
  if (typeof input === "string") {
    for (let i = 0; i < input.length; i++) hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  } else {
    const arr = new Uint8Array(input);
    for (let i = 0; i < arr.length; i += 32) hash = ((hash << 5) + hash) ^ arr[i];
  }
  return (hash >>> 0).toString(16).slice(0, 4).padStart(4, "0");
}

export function absoluteUrl(base: string, relative: string): string | null {
  try {
    return new URL(relative, base).toString();
  } catch {
    return null;
  }
}

// Rimuovi query di tracking comuni.
export function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(
      (k) => u.searchParams.delete(k),
    );
    return u.toString();
  } catch {
    return url;
  }
}
