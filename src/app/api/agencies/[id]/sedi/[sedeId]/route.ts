import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { FONTI_SEDE, leggiSedi, messaggioErroreSede, testoOpzionale } from "@/lib/sedi";

// Una sede di un'agenzia. Auth: staff. Entrambi ritornano { sedi, geo } aggiornati.
// PATCH → Body: { comune_codice?, citta_estera?, indirizzo?, fonte?, principale?: true }
//   Il paese di una sede non cambia: per spostarla tra Italia ed estero si cancella e se ne aggiunge
//   una nuova. principale: true la rende principale (la vecchia smette di esserlo).
// DELETE → cancella la sede; se era la principale, il DB ne promuove un'altra.

type Ctx = { params: Promise<{ id: string; sedeId: string }> };

async function sedeDellAgenzia(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  id: string,
  sedeId: string,
) {
  const { data } = await supabase
    .from("agency_sedi")
    .select("id, paese")
    .eq("id", sedeId)
    .eq("agency_id", id)
    .maybeSingle();
  return data as { id: string; paese: string } | null;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id, sedeId } = await ctx.params;

  const sede = await sedeDellAgenzia(auth.supabase, id, sedeId);
  if (!sede) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if ("indirizzo" in body) update.indirizzo = testoOpzionale(body.indirizzo);
  if ("fonte" in body) {
    const fonte = testoOpzionale(body.fonte);
    if (!fonte || !(FONTI_SEDE as readonly string[]).includes(fonte)) {
      return NextResponse.json({ error: "Fonte non valida." }, { status: 400 });
    }
    update.fonte = fonte;
  }
  if ("comune_codice" in body) {
    if (sede.paese !== "IT") {
      return NextResponse.json({ error: "Una sede all'estero non ha un comune italiano." }, { status: 400 });
    }
    const comune = testoOpzionale(body.comune_codice);
    if (!comune) return NextResponse.json({ error: "Scegli il comune dall'elenco." }, { status: 400 });
    update.comune_codice = comune;
  }
  if ("citta_estera" in body) {
    if (sede.paese === "IT") {
      return NextResponse.json({ error: "Per una sede in Italia si sceglie il comune." }, { status: 400 });
    }
    const citta = testoOpzionale(body.citta_estera);
    if (!citta) return NextResponse.json({ error: "Scrivi la città." }, { status: 400 });
    update.citta_estera = citta;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await auth.supabase.from("agency_sedi").update(update).eq("id", sedeId);
    if (error) return NextResponse.json({ error: messaggioErroreSede(error) }, { status: 400 });
  }
  if (body.principale === true) {
    const { error } = await auth.supabase.rpc("imposta_sede_principale", { p_sede_id: sedeId });
    if (error) return NextResponse.json({ error: messaggioErroreSede(error) }, { status: 400 });
  }

  const res = await leggiSedi(auth.supabase, id);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id, sedeId } = await ctx.params;

  const sede = await sedeDellAgenzia(auth.supabase, id, sedeId);
  if (!sede) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await auth.supabase.from("agency_sedi").delete().eq("id", sedeId);
  if (error) return NextResponse.json({ error: messaggioErroreSede(error) }, { status: 400 });

  const res = await leggiSedi(auth.supabase, id);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json(res);
}
