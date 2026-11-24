import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import type { ComuneTrovato } from "@/lib/sedi";

// GET /api/comuni?q=forli&domain_id=… — autocompletamento del comune per le sedi delle agenzie.
// Ricerca senza accenti sull'inizio del nome (anche tedesco per i comuni bilingui); ogni comune porta
// provincia e regione del dominio. Auth: staff.
export async function GET(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const domainId = req.nextUrl.searchParams.get("domain_id") ?? "";
  if (!domainId) return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });
  if (q.length < 2) return NextResponse.json({ comuni: [] });

  const { data, error } = await auth.supabase.rpc("cerca_comuni", {
    p_domain_id: domainId,
    p_testo: q,
    p_limite: 15,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comuni: (data ?? []) as ComuneTrovato[] });
}
