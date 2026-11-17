// Copertina di un articolo nello storage di Supabase (bucket agency-visuals, cartella contenuti/).
// Accetta un file caricato (multipart, campo "file") oppure { url } di un'immagine da copiare: serve
// anche a portare via dal vecchio WordPress le copertine importate.

import { NextResponse, type NextRequest } from "next/server";
import imageSize from "image-size";
import { requireStaff } from "@/lib/api-auth";
import { downloadImage } from "@/lib/agents/agency-visual-enrichment/storage";

const BUCKET = "agency-visuals";
const MAX_BYTES = 8 * 1024 * 1024;
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;

  const { data: articolo } = await auth.supabase.from("articles").select("slug").eq("id", id).single();
  if (!articolo) return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });

  let buffer: Buffer;
  let mime: string;
  if (req.headers.get("content-type")?.startsWith("multipart/form-data")) {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Nessun file" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File oltre 8 MB" }, { status: 400 });
    buffer = Buffer.from(await file.arrayBuffer());
    mime = file.type;
  } else {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    if (!body?.url) return NextResponse.json({ error: "URL mancante" }, { status: 400 });
    const scaricata = await downloadImage(body.url);
    if (!scaricata) return NextResponse.json({ error: "Immagine non scaricabile" }, { status: 400 });
    buffer = scaricata.buffer;
    mime = scaricata.mime_type;
  }

  const estensione = ESTENSIONI[mime];
  if (!estensione) return NextResponse.json({ error: `Formato non supportato (${mime || "sconosciuto"})` }, { status: 400 });

  let width: number | null = null;
  let height: number | null = null;
  try {
    const dim = imageSize(buffer);
    width = dim.width ?? null;
    height = dim.height ?? null;
  } catch {
    // Dimensioni ignote: la copertina resta valida, il sito non riserverà lo spazio esatto.
  }

  // Nome nuovo a ogni caricamento: la CDN non serve mai la versione vecchia in cache.
  const percorso = `contenuti/${articolo.slug}-${Date.now().toString(36)}.${estensione}`;
  const { error: upErr } = await auth.supabase.storage.from(BUCKET).upload(percorso, buffer, { contentType: mime });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  const { data: pubblico } = auth.supabase.storage.from(BUCKET).getPublicUrl(percorso);

  const { error } = await auth.supabase
    .from("articles")
    .update({ cover_url: pubblico.publicUrl, cover_width: width, cover_height: height })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cover_url: pubblico.publicUrl, cover_width: width, cover_height: height });
}
