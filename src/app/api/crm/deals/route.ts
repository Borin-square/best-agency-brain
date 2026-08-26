import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireStaff } from "@/lib/api-auth";

// GET /api/crm/deals?domain_id=&stage_id=&agency_id=&q=
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();
  const stageId = url.searchParams.get("stage_id")?.trim();
  const agencyId = url.searchParams.get("agency_id")?.trim();
  const q = url.searchParams.get("q")?.trim();

  const supabase = createServiceClient();
  let query = supabase
    .from("deals")
    .select(
      "id, title, amount_eur, probability, expected_close_date, actual_close_date, source, updated_at, stage_id, agency_id, primary_contact_id, deal_stages(name, color, order_index), agencies(title), contacts:primary_contact_id(full_name, email)",
    )
    .order("updated_at", { ascending: false });

  if (domainId) query = query.eq("domain_id", domainId);
  if (stageId) query = query.eq("stage_id", stageId);
  if (agencyId) query = query.eq("agency_id", agencyId);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.domain_id || !body?.title) {
    return NextResponse.json({ error: "domain_id + title required" }, { status: 400 });
  }

  const row = {
    domain_id: body.domain_id as string,
    agency_id: (body.agency_id as string | null) || null,
    primary_contact_id: (body.primary_contact_id as string | null) || null,
    title: (body.title as string).trim(),
    stage_id: (body.stage_id as string | null) || null,
    amount_eur: typeof body.amount_eur === "number" ? body.amount_eur : null,
    probability: typeof body.probability === "number" ? body.probability : null,
    expected_close_date: (body.expected_close_date as string | null) || null,
    source: (body.source as string) || "manual",
    owner_id: auth.userId,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : null,
    notes: typeof body.notes === "string" ? body.notes : null,
  };

  const { data, error } = await auth.supabase.from("deals").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
