// Categorie del magazine: elenco e creazione.

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { messaggioErrore, slugify, SLUG_RE, testoONull } from "@/lib/content";

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const domainId = req.nextUrl.searchParams.get("domain_id");
  if (!domainId) return NextResponse.json({ error: "domain_id mancante" }, { status: 400 });
  const { data, error } = await auth.supabase
    .from("article_categories")
    .select("id, slug, name, description, article_category_links(count)")
    .eq("domain_id", domainId)
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = (await req.json().catch(() => null)) as { domain_id?: string; name?: string; description?: string } | null;
  const name = body?.name?.trim();
  if (!body?.domain_id || !name) return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
  const slug = slugify(name);
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: "Nome non valido" }, { status: 400 });
  const { data, error } = await auth.supabase
    .from("article_categories")
    .insert({ domain_id: body.domain_id, name, slug, description: testoONull(body.description) ?? null })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: messaggioErrore(error) }, { status: 400 });
  return NextResponse.json(data);
}
