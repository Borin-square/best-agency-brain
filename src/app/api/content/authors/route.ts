// Autori degli articoli: elenco per dominio (per il menu a tendina dell'editor).

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const domainId = req.nextUrl.searchParams.get("domain_id");
  if (!domainId) return NextResponse.json({ error: "domain_id mancante" }, { status: 400 });
  const { data, error } = await auth.supabase
    .from("content_authors")
    .select("id, slug, name")
    .eq("domain_id", domainId)
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}
