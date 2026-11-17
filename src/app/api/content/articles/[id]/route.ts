// Un articolo: lettura, salvataggio (campi + categorie), eliminazione delle sole bozze mai pubblicate.

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { messaggioErrore, SLUG_RE, testoONull } from "@/lib/content";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const { data, error } = await auth.supabase
    .from("articles")
    .select("*, article_category_links(category_id)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });
  const { article_category_links, ...articolo } = data as Record<string, unknown> & {
    article_category_links: { category_id: string }[];
  };
  return NextResponse.json({ ...articolo, category_ids: article_category_links.map((l) => l.category_id) });
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
  if (typeof body.slug === "string") {
    if (!SLUG_RE.test(body.slug)) return NextResponse.json({ error: "Slug non valido" }, { status: 400 });
    patch.slug = body.slug;
  }
  if (typeof body.body_md === "string") patch.body_md = body.body_md;
  for (const campo of ["excerpt", "cover_alt", "seo_title", "meta_description"] as const) {
    const v = testoONull(body[campo]);
    if (v !== undefined) patch[campo] = v;
  }
  if (body.author_id !== undefined) patch.author_id = body.author_id || null;
  if (body.status === "draft" || body.status === "publish") patch.status = body.status;
  if (body.published_at !== undefined) patch.published_at = body.published_at || null;
  // Pubblicare senza data significa "adesso"; se la data c'era già e non arriva nel salvataggio, resta.
  if (patch.status === "publish" && !patch.published_at) {
    const { data: attuale } = await auth.supabase.from("articles").select("published_at").eq("id", id).single();
    patch.published_at =
      body.published_at === undefined && attuale?.published_at ? attuale.published_at : new Date().toISOString();
  }

  if (Object.keys(patch).length) {
    const { error } = await auth.supabase.from("articles").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: messaggioErrore(error) }, { status: 400 });
  }

  if (Array.isArray(body.category_ids)) {
    const ids = body.category_ids.filter((x): x is string => typeof x === "string");
    const { error: delErr } = await auth.supabase.from("article_category_links").delete().eq("article_id", id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
    if (ids.length) {
      const { error: insErr } = await auth.supabase
        .from("article_category_links")
        .insert(ids.map((category_id) => ({ article_id: id, category_id })));
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    }
  }

  return GET(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  // Un articolo pubblicato ha un URL indicizzato: si rimette in bozza, non si cancella.
  const { data } = await auth.supabase.from("articles").select("published_at").eq("id", id).single();
  if (data?.published_at) {
    return NextResponse.json({ error: "Un articolo già pubblicato non si elimina: rimettilo in bozza." }, { status: 400 });
  }
  const { error } = await auth.supabase.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
