// Download file da URL originale + upload su Supabase Storage bucket "agency-visuals".
// Usa header content-length come pre-check per evitare file enormi.

import type { SupabaseClient } from "@supabase/supabase-js";
import imageSize from "image-size";

const BUCKET = "agency-visuals";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const FETCH_TIMEOUT_MS = 15_000;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface DownloadedImage {
  buffer: Buffer;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
}

export async function downloadImage(url: string): Promise<DownloadedImage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": BROWSER_UA, accept: "image/*,*/*;q=0.8" },
    });
    if (!res.ok) return null;

    // Pre-check content-length
    const cl = res.headers.get("content-length");
    if (cl && parseInt(cl, 10) > MAX_BYTES) return null;

    const arr = await res.arrayBuffer();
    if (arr.byteLength === 0 || arr.byteLength > MAX_BYTES) return null;

    const buffer = Buffer.from(arr);
    const mimeType = (res.headers.get("content-type") ?? "").split(";")[0].trim() || sniffMime(buffer);

    let width: number | null = null;
    let height: number | null = null;
    try {
      const dims = imageSize(buffer);
      width = dims.width ?? null;
      height = dims.height ?? null;
    } catch {
      // SVG e alcuni formati non parsati: dimensioni ignote (non blocking)
    }

    return { buffer, mime_type: mimeType, size_bytes: buffer.length, width, height };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Sniff basico dei primi bytes per determinare mime quando header manca/è wrong.
function sniffMime(buf: Buffer): string {
  if (buf.length < 4) return "application/octet-stream";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "image/webp";
  // SVG (ASCII)
  const start = buf.subarray(0, Math.min(200, buf.length)).toString("utf8").trim().toLowerCase();
  if (start.startsWith("<?xml") || start.startsWith("<svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export interface UploadResult {
  path: string;
  public_url: string;
}

/**
 * Carica su bucket "agency-visuals" con upsert=false (skip se path esiste).
 * Se path esiste, ritorna comunque URL pubblico (nessun errore).
 */
export async function uploadToStorage(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UploadResult | { error: string }> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  // Se già presente, va bene: costruiamo URL pubblico e ritorniamo
  if (error && !/already exists|duplicate|resource already exists/i.test(error.message)) {
    return { error: error.message };
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, public_url: data.publicUrl };
}
