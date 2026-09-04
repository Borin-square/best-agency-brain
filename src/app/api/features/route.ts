import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

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

// GET /api/features?domain_id=X&area_type=regione|citta&area_slug=Y&skill=Z
// Ritorna featured della combo, ordinate per sort_order, con info agenzia.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();
  const areaType = url.searchParams.get("area_type")?.trim();
  const areaSlug = url.searchParams.get("area_slug")?.trim();
  const skill = url.searchParams.get("skill")?.trim();
  if (!domainId || !areaType || !areaSlug || !skill) {
    return NextResponse.json(
      { error: "missing_params", required: ["domain_id", "area_type", "area_slug", "skill"] },
      { status: 400 },
    );
  }
  if (areaType !== "regione" && areaType !== "citta") {
    return NextResponse.json({ error: "invalid_area_type" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agency_features")
    .select("id, agency_id, area_type, area_slug, skill_slug, sort_order, agencies!inner(id, title, citta, regioni, domain_id, verifica)")
    .eq("area_type", areaType)
    .eq("area_slug", areaSlug)
    .eq("skill_slug", skill)
    .eq("agencies.domain_id", domainId)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

// POST /api/features { agency_id, area_type, area_slug, skill_slug }
export async function POST(req: NextRequest) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as {
    agency_id?: string;
    area_type?: string;
    area_slug?: string;
    skill_slug?: string;
  } | null;

  if (!body?.agency_id || !body.area_type || !body.area_slug || !body.skill_slug) {
    return NextResponse.json(
      { error: "missing_fields", required: ["agency_id", "area_type", "area_slug", "skill_slug"] },
      { status: 400 },
    );
  }
  if (body.area_type !== "regione" && body.area_type !== "citta") {
    return NextResponse.json({ error: "invalid_area_type" }, { status: 400 });
  }

  // Auto sort_order = max(existing) + 1 nella combo
  const { data: maxRow } = await auth.supabase
    .from("agency_features")
    .select("sort_order")
    .eq("area_type", body.area_type)
    .eq("area_slug", body.area_slug)
    .eq("skill_slug", body.skill_slug)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = maxRow ? (maxRow.sort_order as number) + 1 : 1;

  const { data, error } = await auth.supabase
    .from("agency_features")
    .insert({
      agency_id: body.agency_id,
      area_type: body.area_type,
      area_slug: body.area_slug,
      skill_slug: body.skill_slug,
      sort_order: nextOrder,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
