import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Legge le colonne reali della tabella public.agencies da information_schema
// per il drift check contro FIELDS_CATALOG.
export async function GET() {
  const supabase = createServiceClient();

  // Supabase JS non permette query dirette su information_schema, ma abbiamo
  // il service role: fetchiamo una riga vuota di agencies e ci ricaviamo le
  // colonne dai keys della risposta select("*"). Semplice e senza RPC.
  //
  // Alternativa più robusta: creare una RPC su Supabase. Per ora questo
  // approccio basta: se la tabella ha ≥ 1 riga (sempre vero in prod) ottieni
  // tutti i nomi colonna. Se è vuota, la risposta ha 0 righe: fallback a
  // una query LIMIT 0 con select "*" restituisce comunque struttura null.
  const { data, error } = await supabase.from("agencies").select("*").limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const columns = data && data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [];

  return NextResponse.json({ table: "agencies", columns });
}
