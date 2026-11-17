// Una categoria: modifica di nome e descrizione. Lo slug non si cambia (è l'URL /category/{slug}/).

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { testoONull } from "@/lib/content";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { name?: string; description?: string } | null;
  const patch: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
  const descrizione = testoONull(body?.description);
  if (descrizione !== undefined) patch.description = descrizione;
  const { error } = await auth.supabase.from("article_categories").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
