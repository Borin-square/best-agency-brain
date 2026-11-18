import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireStaff } from "@/lib/api-auth";
import { EDITABLE_FIELDS, coerceFieldValue } from "@/lib/agency-editable";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "not_found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

// PATCH /api/agencies/[id] — modifica manuale dei campi dalla scheda agenzia.
// Auth: staff. Body: { fields?: { [colonna]: valore }, unlock?: string[] }
// - fields: solo le colonne in EDITABLE_FIELDS (src/lib/agency-editable.ts), convertite nel tipo giusto.
//   Ogni campo salvato entra in manual_fields: l'agency-updater non lo sovrascrive più.
// - unlock: toglie i campi da manual_fields, così l'agente torna ad aggiornarli.
// Ritorna l'agenzia aggiornata.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as {
    fields?: Record<string, unknown>;
    unlock?: unknown;
  } | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const fields = body.fields && typeof body.fields === "object" ? body.fields : {};
  const unlock = Array.isArray(body.unlock)
    ? body.unlock.filter((k): k is string => typeof k === "string" && k in EDITABLE_FIELDS)
    : [];

  const update: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(fields)) {
    const res = coerceFieldValue(key, raw);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    update[key] = res.value;
  }

  const edited = Object.keys(update);
  if (edited.length === 0 && unlock.length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { data: current, error: curErr } = await auth.supabase
    .from("agencies")
    .select("manual_fields")
    .eq("id", id)
    .single();
  if (curErr || !current) {
    return NextResponse.json({ error: curErr?.message ?? "not_found" }, { status: 404 });
  }

  const locked = new Set<string>((current.manual_fields as string[] | null) ?? []);
  for (const k of edited) locked.add(k);
  for (const k of unlock) locked.delete(k);
  update.manual_fields = Array.from(locked).sort();

  const { data, error } = await auth.supabase
    .from("agencies")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
