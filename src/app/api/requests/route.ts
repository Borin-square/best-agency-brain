// Richieste arrivate dai form del sito pubblico (tabella site_requests, migrazione 0036): elenco
// per dominio, le più recenti prima, con il contatto CRM del mittente (migrazione 0038).
// Filtri facoltativi: stato e tipo.

import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";

const STATI = ["nuova", "in_lavorazione", "chiusa", "spam"];
const TIPI = ["trova", "proponi"];

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const p = req.nextUrl.searchParams;
  const domainId = p.get("domain_id");
  if (!domainId) return NextResponse.json({ error: "domain_id mancante" }, { status: 400 });

  let q = auth.supabase
    .from("site_requests")
    .select("id, tipo, dati, email, pagina, stato, note, email_inviata, contact_id, created_at, updated_at")
    .eq("domain_id", domainId)
    .order("created_at", { ascending: false })
    .limit(500);
  const stato = p.get("stato");
  if (stato && STATI.includes(stato)) q = q.eq("stato", stato);
  const tipo = p.get("tipo");
  if (tipo && TIPI.includes(tipo)) q = q.eq("tipo", tipo);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}
