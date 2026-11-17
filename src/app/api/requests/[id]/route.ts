// Una richiesta dai form del sito: lo staff ne cambia lo stato e le note interne. I dati inviati
// dal sito non si modificano.

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";

const STATI = ["nuova", "in_lavorazione", "chiusa", "spam"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { stato?: string; note?: string | null } | null;

  const patch: Record<string, unknown> = {};
  if (body && "stato" in body) {
    if (!body.stato || !STATI.includes(body.stato)) return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
    patch.stato = body.stato;
  }
  if (body && "note" in body) patch.note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Niente da modificare" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("site_requests")
    .update(patch)
    .eq("id", id)
    .select("id, stato, note, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json(data);
}
