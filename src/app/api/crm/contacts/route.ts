import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireStaff } from "@/lib/api-auth";

// GET /api/crm/contacts?domain_id=&q=&agency_id=&status=&page=
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainId = url.searchParams.get("domain_id")?.trim();
  const q = url.searchParams.get("q")?.trim();
  const agencyId = url.searchParams.get("agency_id")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const PAGE_SIZE = 50;

  const supabase = createServiceClient();
  let query = supabase
    .from("contacts")
    .select(
      "id, agency_id, full_name, first_name, last_name, email, phone, role, linkedin_url, status, tags, source, updated_at, agencies(title)",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });

  if (domainId) query = query.eq("domain_id", domainId);
  if (agencyId) query = query.eq("agency_id", agencyId);
  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
}

// POST /api/crm/contacts
export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.domain_id) {
    return NextResponse.json({ error: "domain_id required" }, { status: 400 });
  }

  const firstName = typeof body.first_name === "string" ? body.first_name.trim() : null;
  const lastName = typeof body.last_name === "string" ? body.last_name.trim() : null;
  const fullName =
    typeof body.full_name === "string" && body.full_name.trim()
      ? body.full_name.trim()
      : [firstName, lastName].filter(Boolean).join(" ") || null;

  const row = {
    domain_id: body.domain_id as string,
    agency_id: (body.agency_id as string | null) || null,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : null,
    phone: typeof body.phone === "string" ? body.phone.trim() : null,
    role: typeof body.role === "string" ? body.role.trim() : null,
    linkedin_url: typeof body.linkedin_url === "string" ? body.linkedin_url.trim() : null,
    source: (body.source as string) || "manual",
    status: (body.status as string) || "new",
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : null,
    notes: typeof body.notes === "string" ? body.notes : null,
  };

  const { data, error } = await auth.supabase.from("contacts").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
