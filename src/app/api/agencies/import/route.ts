import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { parseCsv, mapAgencyRow } from "@/lib/agency-csv";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — l'import di 1735 righe richiede più del default 10s

// Import CSV WP All Import → upsert in agencies.
// Autenticato via Supabase JWT (Bearer) + verifica ruolo owner/dev.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "owner" && profile.role !== "dev")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // File upload via FormData
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const domainId = String(formData.get("domain_id") ?? "").trim();
  if (!domainId) {
    return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });
  }

  const raw = await file.text();
  const rows = parseCsv(raw);
  const mapped = rows
    .map(mapAgencyRow)
    .filter((r): r is Record<string, unknown> => r !== null)
    .map((r) => ({ ...r, domain_id: domainId }));

  if (mapped.length === 0) {
    // Debug diagnostica: torna preview per capire cosa non funziona
    const firstRow = rows[0];
    return NextResponse.json({
      error: "no_valid_rows",
      parsed: rows.length,
      debug: {
        file_size: raw.length,
        first_100_chars: raw.slice(0, 100),
        headers_detected: firstRow ? Object.keys(firstRow) : [],
        first_row_sample: firstRow
          ? {
              Title: firstRow["Title"] ?? "(missing key)",
              ID: firstRow["ID"] ?? "(missing key)",
              Citta: firstRow["Città"] ?? "(missing key)",
            }
          : null,
      },
    }, { status: 400 });
  }

  const CHUNK = 200;
  let imported = 0;
  let errorCount = 0;
  const chunkErrors: string[] = [];

  for (let i = 0; i < mapped.length; i += CHUNK) {
    const chunk = mapped.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from("agencies")
      .upsert(chunk, {
        onConflict: "domain_id,wp_id",
        ignoreDuplicates: false,
        count: "exact",
      });

    if (error) {
      errorCount += chunk.length;
      chunkErrors.push(`chunk ${i / CHUNK + 1}: ${error.message}`);
    } else {
      imported += count ?? chunk.length;
    }
  }

  return NextResponse.json({
    ok: true,
    parsed: rows.length,
    mapped: mapped.length,
    imported,
    errors: errorCount,
    error_details: chunkErrors.length > 0 ? chunkErrors : undefined,
  });
}
