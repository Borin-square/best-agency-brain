import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireStaff } from "@/lib/api-auth";

// GET /api/crm/activities?domain_id=&contact_id=&deal_id=&agency_id=&type=&limit=
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();
  const contactId = url.searchParams.get("contact_id")?.trim();
  const dealId = url.searchParams.get("deal_id")?.trim();
  const agencyId = url.searchParams.get("agency_id")?.trim();
  const type = url.searchParams.get("type")?.trim();
  const limit = Math.min(200, parseInt(url.searchParams.get("limit") ?? "50", 10));

  const supabase = createServiceClient();
  let query = supabase
    .from("activities")
    .select("*, contacts(full_name, email), deals(title), profiles:author_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (domainId) query = query.eq("domain_id", domainId);
  if (contactId) query = query.eq("contact_id", contactId);
  if (dealId) query = query.eq("deal_id", dealId);
  if (agencyId) query = query.eq("agency_id", agencyId);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.domain_id || !body?.type) {
    return NextResponse.json({ error: "domain_id + type required" }, { status: 400 });
  }
  const allowedTypes = ["email", "call", "meeting", "note", "task", "sms", "other"];
  if (!allowedTypes.includes(body.type as string)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const row = {
    domain_id: body.domain_id as string,
    agency_id: (body.agency_id as string | null) || null,
    contact_id: (body.contact_id as string | null) || null,
    deal_id: (body.deal_id as string | null) || null,
    type: body.type as string,
    direction: (body.direction as string | null) || null,
    subject: typeof body.subject === "string" ? body.subject.trim() : null,
    body: typeof body.body === "string" ? body.body : null,
    meta: (body.meta as Record<string, unknown> | null) || null,
    completed: Boolean(body.completed),
    due_at: (body.due_at as string | null) || null,
    author_id: auth.userId,
  };

  const { data, error } = await auth.supabase.from("activities").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
