// Articoli del magazine: elenco (tutti gli stati) e creazione di una bozza.

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { messaggioErrore, slugify, SLUG_RE } from "@/lib/content";

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const domainId = req.nextUrl.searchParams.get("domain_id");
  if (!domainId) return NextResponse.json({ error: "domain_id mancante" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("articles")
    .select("id, slug, title, status, published_at, updated_at, cover_url, article_category_links(article_categories(slug, name))")
    .eq("domain_id", domainId)
    .order("published_at", { ascending: false, nullsFirst: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = (await req.json().catch(() => null)) as { domain_id?: string; title?: string; slug?: string } | null;
  const title = body?.title?.trim();
  if (!body?.domain_id || !title) return NextResponse.json({ error: "Titolo obbligatorio" }, { status: 400 });

  const slug = body.slug?.trim() ? body.slug.trim() : slugify(title);
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: "Slug non valido" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("articles")
    .insert({ domain_id: body.domain_id, title, slug, status: "draft" })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: messaggioErrore(error) }, { status: 400 });
  return NextResponse.json(data);
}
