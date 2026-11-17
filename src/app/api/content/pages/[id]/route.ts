// Una pagina: lettura e salvataggio del testo. Lo slug non si cambia: è l'URL della pagina del sito.

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { testoONull } from "@/lib/content";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const { data, error } = await auth.supabase.from("site_pages").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: "Pagina non trovata" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corpo non valido" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    if (!body.title.trim()) return NextResponse.json({ error: "Titolo obbligatorio" }, { status: 400 });
    patch.title = body.title.trim();
  }
  if (typeof body.body_md === "string") patch.body_md = body.body_md;
  for (const campo of ["subtitle", "seo_title", "meta_description"] as const) {
    const v = testoONull(body[campo]);
    if (v !== undefined) patch[campo] = v;
  }
  const { error } = await auth.supabase.from("site_pages").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return GET(req, ctx);
}
