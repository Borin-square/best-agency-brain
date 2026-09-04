import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const PAGE_SIZE = 25;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireOwnerOrDev(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return { error: "unauthorized" as const, status: 401 as const };
  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) return { error: "invalid_token" as const, status: 401 as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "owner" && profile.role !== "dev")) {
    return { error: "forbidden" as const, status: 403 as const };
  }
  return { supabase };
}

// POST /api/agencies — crea agenzia a mano (bypass CSV import/scouter agent).
// Auth: owner|dev. Body: { domain_id, title, sito_web?, status_curatela?, publish_status?, note_curatore? }
export async function POST(req: NextRequest) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as {
    domain_id?: string;
    title?: string;
    sito_web?: string;
    status_curatela?: string;
    publish_status?: string;
    note_curatore?: string;
  } | null;

  if (!body?.domain_id || !body.title?.trim()) {
    return NextResponse.json(
      { error: "missing_fields", required: ["domain_id", "title"] },
      { status: 400 },
    );
  }

  const title = body.title.trim();
  const base = slugify(title) || `agency-${Date.now()}`;
  // suffisso random per evitare collisioni con slug esistenti (unique)
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  const insertRow = {
    domain_id: body.domain_id,
    title,
    title_originale: title,
    slug,
    sito_web: body.sito_web?.trim() || null,
    status_curatela: body.status_curatela?.trim() || "proposta",
    publish_status: body.publish_status?.trim() || "draft",
    note_curatore: body.note_curatore?.trim() || null,
  };

  const { data, error } = await auth.supabase
    .from("agencies")
    .insert(insertRow)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// Lista agenzie paginata + filtri.
// Query params:
//   page (default 1)
//   domain_id
//   q (search su title)
//   regione, citta (slug)
//   verifica
//   status_curatela
//   enriched (yes|no)
//   enrichment_status (success|partial|error)
//   has_website (yes|no)
//   has_email (yes|no)
//   has_phone (yes|no)
//   min_rating (numero 0-5)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const q = url.searchParams.get("q")?.trim();
  const regione = url.searchParams.get("regione")?.trim();
  const citta = url.searchParams.get("citta")?.trim();
  const verifica = url.searchParams.get("verifica")?.trim();
  const statusCuratela = url.searchParams.get("status_curatela")?.trim();
  const enriched = url.searchParams.get("enriched");
  const enrichmentStatus = url.searchParams.get("enrichment_status")?.trim();
  const hasWebsite = url.searchParams.get("has_website");
  const hasEmail = url.searchParams.get("has_email");
  const hasPhone = url.searchParams.get("has_phone");
  const minRatingRaw = url.searchParams.get("min_rating");
  const minRating = minRatingRaw ? parseFloat(minRatingRaw) : NaN;
  const domainId = url.searchParams.get("domain_id")?.trim();

  const supabase = createServiceClient();

  let query = supabase
    .from("agencies")
    .select(
      "id, wp_id, title, citta, regioni, verifica, status_curatela, google_rating, google_recensioni_count, match_confidence, last_enriched_at",
      { count: "exact" },
    )
    .order("wp_id", { ascending: true, nullsFirst: false });

  if (domainId) query = query.eq("domain_id", domainId);
  if (q) query = query.ilike("title", `%${q}%`);
  if (regione) query = query.eq("regioni", regione);
  if (citta) query = query.eq("citta", citta);
  if (verifica) query = query.eq("verifica", verifica);
  if (statusCuratela) query = query.eq("status_curatela", statusCuratela);
  if (enriched === "yes") query = query.not("last_enriched_at", "is", null);
  if (enriched === "no") query = query.is("last_enriched_at", null);
  if (enrichmentStatus) query = query.eq("enrichment_status", enrichmentStatus);
  if (hasWebsite === "yes") query = query.not("sito_web", "is", null);
  if (hasWebsite === "no") query = query.is("sito_web", null);
  if (hasEmail === "yes") query = query.not("email", "is", null);
  if (hasEmail === "no") query = query.is("email", null);
  if (hasPhone === "yes") query = query.not("telefono", "is", null);
  if (hasPhone === "no") query = query.is("telefono", null);
  if (!Number.isNaN(minRating) && minRating > 0) {
    query = query.gte("google_rating", minRating);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
}
