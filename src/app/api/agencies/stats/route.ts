import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Statistiche base della tab Agenzie (usato per header count).
export async function GET() {
  const supabase = createServiceClient();

  const [totale, verified, enriched, cities] = await Promise.all([
    supabase.from("agencies").select("*", { count: "exact", head: true }),
    supabase.from("agencies").select("*", { count: "exact", head: true }).eq("verifica", "verified"),
    supabase.from("agencies").select("*", { count: "exact", head: true }).not("last_enriched_at", "is", null),
    supabase.from("agencies").select("citta").not("citta", "is", null),
  ]);

  const uniqueCities = new Set((cities.data ?? []).map((r) => r.citta as string)).size;

  return NextResponse.json({
    total: totale.count ?? 0,
    verified: verified.count ?? 0,
    enriched: enriched.count ?? 0,
    cities: uniqueCities,
  });
}
