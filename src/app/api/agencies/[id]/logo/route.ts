// Logo di un'agenzia impostato a mano dallo staff, nello storage di Supabase (bucket agency-visuals,
// cartella logos/, come quelli dell'agente Visual Enrichment).
// POST: un file caricato (multipart, campo "file") oppure { url } di un'immagine da copiare; con l'URL
//       del logo attuale serve a portare nello storage i loghi che oggi puntano a siti esterni.
// DELETE: toglie il logo (il sito mostra quello generico).
// In entrambi i casi logo_meta.manuale = true: l'agente non sostituisce più il logo, e dopo un DELETE
// non ne cerca un altro.

import { NextResponse, type NextRequest } from "next/server";
import imageSize from "image-size";
import { requireStaff } from "@/lib/api-auth";
import { downloadImage } from "@/lib/agents/agency-visual-enrichment/storage";

const BUCKET = "agency-visuals";
const MAX_BYTES = 5 * 1024 * 1024;
// Niente SVG: può contenere script, e il sito mostra il logo così com'è.
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;

  const { data: agenzia } = await auth.supabase
    .from("agencies")
    .select("title, slug, public_slug")
    .eq("id", id)
    .single();
  if (!agenzia) return NextResponse.json({ error: "Agenzia non trovata" }, { status: 404 });

  let buffer: Buffer;
  let mime: string;
  let fonte: string;
  if (req.headers.get("content-type")?.startsWith("multipart/form-data")) {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Nessun file" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File oltre 5 MB" }, { status: 400 });
    buffer = Buffer.from(await file.arrayBuffer());
    mime = file.type;
    fonte = `caricato a mano: ${file.name}`;
  } else {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = body?.url?.trim();
    if (!url || !/^https?:\/\//i.test(url)) return NextResponse.json({ error: "URL mancante o non valido" }, { status: 400 });
    const scaricata = await downloadImage(url);
    if (!scaricata) return NextResponse.json({ error: "Immagine non scaricabile da quell'URL" }, { status: 400 });
    buffer = scaricata.buffer;
    mime = scaricata.mime_type;
    fonte = url;
  }

  const estensione = ESTENSIONI[mime];
  if (!estensione) {
    return NextResponse.json({ error: `Formato non supportato (${mime || "sconosciuto"}): usa PNG, JPG, WebP o AVIF` }, { status: 400 });
  }

  let width: number | null = null;
  let height: number | null = null;
  try {
    const dim = imageSize(buffer);
    width = dim.width ?? null;
    height = dim.height ?? null;
  } catch {
    // Dimensioni ignote: il logo resta valido.
  }

  // Nome nuovo a ogni caricamento: la CDN non serve mai la versione vecchia in cache.
  const base = agenzia.public_slug || agenzia.slug || id;
  const fileName = `logo-${base}-${Date.now().toString(36)}.${estensione}`;
  const { error: upErr } = await auth.supabase.storage
    .from(BUCKET)
    .upload(`logos/${fileName}`, buffer, { contentType: mime });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  const { data: pubblico } = auth.supabase.storage.from(BUCKET).getPublicUrl(`logos/${fileName}`);

  const logo_meta = {
    file_name: fileName,
    mime_type: mime,
    width,
    height,
    alt_text: `Logo di ${agenzia.title}`,
    description: `Logo ufficiale dell'agenzia ${agenzia.title}.`,
    source_url: fonte,
    confidence: 1,
    manuale: true,
    updated_at: new Date().toISOString(),
  };
  const { error } = await auth.supabase
    .from("agencies")
    .update({ logo_url: pubblico.publicUrl, logo_meta })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logo_url: pubblico.publicUrl, logo_meta });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;

  // Il file resta nello storage: costa poco e permette di tornare indietro.
  const logo_meta = { manuale: true, rimosso: true, updated_at: new Date().toISOString() };
  const { data, error } = await auth.supabase
    .from("agencies")
    .update({ logo_url: null, logo_meta })
    .eq("id", id)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Agenzia non trovata" }, { status: 404 });
  return NextResponse.json({ logo_url: null, logo_meta });
}
