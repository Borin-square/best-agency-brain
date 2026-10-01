import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Restituisce agenzie con coordinate per la mappa homepage.
// Solo agenzie con lat/lng valorizzati.

export async function GET(req: NextRequest) {
  const domainId = new URL(req.url).searchParams.get("domain_id")?.trim();
  if (!domainId) return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agencies")
    .select("id, nome, citta, lat, lng, verified")
    .eq("domain_id", domainId)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ points: data ?? [] });
}
