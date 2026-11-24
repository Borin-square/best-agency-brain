import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { FONTI_SEDE, leggiSedi, messaggioErroreSede, testoOpzionale } from "@/lib/sedi";

// Sedi di un'agenzia (docs/sedi-progetto.md). Auth: staff.
// GET  → { sedi, geo }   (geo = aree/citta/regioni calcolati dal DB dalle sedi)
// POST → aggiunge una sede e ritorna { sedi, geo }.
//   Body: { paese?: "IT", comune_codice?: "015146", citta_estera?: "Lugano",
//           indirizzo?: string, fonte?: FonteSede, principale?: boolean }
//   In Italia serve comune_codice (provincia e regione le calcola il DB); all'estero citta_estera.
//   La prima sede di un'agenzia diventa principale da sola.

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;

  const res = await leggiSedi(auth.supabase, id);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json(res);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const paese = (testoOpzionale(body.paese) ?? "IT").toUpperCase();
  if (!/^[A-Z]{2}$/.test(paese)) {
    return NextResponse.json({ error: "Paese non valido (codice di due lettere)." }, { status: 400 });
  }
  const comune = testoOpzionale(body.comune_codice);
  const citta = testoOpzionale(body.citta_estera);
  if (paese === "IT" && !comune) {
    return NextResponse.json({ error: "Scegli il comune dall'elenco." }, { status: 400 });
  }
  if (paese !== "IT" && !citta) {
    return NextResponse.json({ error: "Scrivi la città." }, { status: 400 });
  }
  const fonte = testoOpzionale(body.fonte) ?? "verifica";
  if (!(FONTI_SEDE as readonly string[]).includes(fonte)) {
    return NextResponse.json({ error: "Fonte non valida." }, { status: 400 });
  }

  const { data: agenzia } = await auth.supabase.from("agencies").select("id").eq("id", id).single();
  if (!agenzia) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: nuova, error } = await auth.supabase
    .from("agency_sedi")
    .insert({
      agency_id: id,
      paese,
      comune_codice: paese === "IT" ? comune : null,
      citta_estera: paese === "IT" ? null : citta,
      indirizzo: testoOpzionale(body.indirizzo),
      fonte,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: messaggioErroreSede(error) }, { status: 400 });

  if (body.principale === true) {
    const { error: errP } = await auth.supabase.rpc("imposta_sede_principale", { p_sede_id: nuova.id });
    if (errP) return NextResponse.json({ error: messaggioErroreSede(errP) }, { status: 400 });
  }

  const res = await leggiSedi(auth.supabase, id);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json(res);
}
