// L'agenzia di una proposta "Proponi un'agenzia" (site_requests.agency_id, migrazione 0039).
//   GET    → agenzia collegata, oppure le candidate tra le agenzie del dominio (per sito, poi per nome)
//   POST   { agency_id } collega un'agenzia esistente
//   POST   { crea: true } crea una bozza dai dati del form e la collega; rifiuta se il sito
//          corrisponde già a un'agenzia del dominio
//   DELETE scollega (la scheda dell'agenzia resta)

import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireStaff } from "@/lib/api-auth";
import { slugify } from "@/lib/content";
import { isDirectoryOrSocialDomain, normalizeAgencyName, normalizeDomain, normalizeUrl } from "@/lib/agents/agency-scouter/domain";

type Dati = Record<string, string | string[] | undefined>;
interface Proposta {
  id: string;
  domain_id: string;
  tipo: string;
  dati: Dati;
  agency_id: string | null;
  created_at: string;
}
export interface AgenziaBreve {
  id: string;
  title: string;
  sito_web: string | null;
  citta: string | null;
  publish_status: string | null;
  status_curatela: string | null;
}
const CAMPI_AGENZIA = "id, title, sito_web, citta, publish_status, status_curatela";

const testo = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? "")).trim();
const lista = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).map((s) => s.trim()).filter(Boolean);
// Toglie i caratteri jolly di ilike da un testo inserito da chi compila il form.
const perIlike = (s: string) => s.replace(/[%_\\]/g, " ").trim();

async function caricaProposta(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("site_requests")
    .select("id, domain_id, tipo, dati, agency_id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return { errore: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!data) return { errore: NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 }) };
  if (data.tipo !== "proponi") return { errore: NextResponse.json({ error: "Non è una proposta di agenzia" }, { status: 400 }) };
  return { proposta: data as Proposta };
}

// Agenzie del dominio con lo stesso sito della proposta. Il dominio di una directory o di un social
// (linkedin.com, …) non identifica un'agenzia e non si usa.
async function perSito(supabase: SupabaseClient, p: Proposta): Promise<AgenziaBreve[]> {
  const dominio = normalizeDomain(testo(p.dati.sito));
  if (!dominio || isDirectoryOrSocialDomain(dominio)) return [];
  const { data } = await supabase
    .from("agencies")
    .select(CAMPI_AGENZIA)
    .eq("domain_id", p.domain_id)
    .ilike("sito_web", `%${perIlike(dominio)}%`)
    .limit(20);
  return ((data ?? []) as AgenziaBreve[]).filter((a) => normalizeDomain(a.sito_web) === dominio);
}

async function perNome(supabase: SupabaseClient, p: Proposta): Promise<AgenziaBreve[]> {
  const nome = perIlike(testo(p.dati.nome_agenzia));
  if (nome.length < 3) return [];
  const { data } = await supabase.from("agencies").select(CAMPI_AGENZIA).eq("domain_id", p.domain_id).ilike("title", `%${nome}%`).limit(10);
  const chiave = normalizeAgencyName(nome);
  // Prima chi ha lo stesso nome normalizzato.
  return ((data ?? []) as AgenziaBreve[]).sort(
    (a, b) => Number(normalizeAgencyName(b.title) === chiave) - Number(normalizeAgencyName(a.title) === chiave),
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const { proposta, errore } = await caricaProposta(auth.supabase, id);
  if (errore) return errore;

  if (proposta.agency_id) {
    const { data } = await auth.supabase.from("agencies").select(CAMPI_AGENZIA).eq("id", proposta.agency_id).maybeSingle();
    return NextResponse.json({ collegata: data ?? null, candidate: [] });
  }

  const [sito, nome] = await Promise.all([perSito(auth.supabase, proposta), perNome(auth.supabase, proposta)]);
  const visti = new Set(sito.map((a) => a.id));
  const candidate = [
    ...sito.map((a) => ({ ...a, motivo: "stesso sito" })),
    ...nome.filter((a) => !visti.has(a.id)).map((a) => ({ ...a, motivo: "nome simile" })),
  ];
  return NextResponse.json({ collegata: null, candidate });
}

async function collega(supabase: SupabaseClient, requestId: string, agencyId: string | null) {
  const { error } = await supabase.from("site_requests").update({ agency_id: agencyId }).eq("id", requestId);
  return error;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const { proposta, errore } = await caricaProposta(auth.supabase, id);
  if (errore) return errore;
  const body = (await req.json().catch(() => null)) as { agency_id?: string; crea?: boolean } | null;

  // Collega un'agenzia esistente, dello stesso dominio della proposta.
  if (body?.agency_id) {
    const { data: agenzia } = await auth.supabase
      .from("agencies")
      .select(CAMPI_AGENZIA)
      .eq("id", body.agency_id)
      .eq("domain_id", proposta.domain_id)
      .maybeSingle();
    if (!agenzia) return NextResponse.json({ error: "Agenzia non trovata in questo dominio" }, { status: 404 });
    const err = await collega(auth.supabase, id, agenzia.id);
    if (err) return NextResponse.json({ error: err.message }, { status: 500 });
    return NextResponse.json({ collegata: agenzia });
  }

  if (!body?.crea) return NextResponse.json({ error: "Indica agency_id oppure crea" }, { status: 400 });
  if (proposta.agency_id) return NextResponse.json({ error: "La proposta è già collegata a un'agenzia" }, { status: 409 });

  const doppioni = await perSito(auth.supabase, proposta);
  if (doppioni.length) {
    return NextResponse.json({ error: `Esiste già un'agenzia con questo sito: ${doppioni[0].title}. Collegala invece di crearne una nuova.` }, { status: 409 });
  }

  const d = proposta.dati;
  const titolo = testo(d.nome_agenzia);
  if (!titolo) return NextResponse.json({ error: "La proposta non ha il nome dell'agenzia" }, { status: 400 });
  const anno = parseInt(testo(d.anno), 10);
  const data = new Date(proposta.created_at).toLocaleDateString("it-IT");
  const proponente = [testo(d.nome_proponente), testo(d.email_proponente)].filter(Boolean).join(", ");
  // Nel form ci sono campi che la scheda non ha, o con valori diversi da quelli della scheda
  // (servizi, settori, team): restano nella nota per chi cura la scheda.
  const nota = [
    `Proposta dal sito il ${data}${proponente ? ` da ${proponente}` : ""}${testo(d.relazione) ? ` (${testo(d.relazione)})` : ""}.`,
    testo(d.servizi) && `Servizi: ${testo(d.servizi)}`,
    testo(d.settori) && `Settori: ${testo(d.settori)}`,
    testo(d.team) && `Team: ${testo(d.team)}`,
    testo(d.case_study) && `Case history: ${testo(d.case_study)}`,
    testo(d.note) && `Note: ${testo(d.note)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { data: creata, error } = await auth.supabase
    .from("agencies")
    .insert({
      domain_id: proposta.domain_id,
      title: titolo,
      title_originale: titolo,
      sito_web: normalizeUrl(testo(d.sito)),
      email: testo(d.email_agenzia).toLowerCase() || null,
      telefono: testo(d.telefono) || null,
      citta: slugify(testo(d.citta)) || null,
      anno_di_fondazione: Number.isFinite(anno) ? anno : null,
      lingue: lista(d.lingue).length ? lista(d.lingue).map((l) => l.toLowerCase()) : null,
      publish_status: "draft",
      status_curatela: "proposta",
      note_curatore: nota,
    })
    .select(CAMPI_AGENZIA)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const err = await collega(auth.supabase, id, creata.id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ collegata: creata });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const { errore } = await caricaProposta(auth.supabase, id);
  if (errore) return errore;
  const err = await collega(auth.supabase, id, null);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ collegata: null });
}
