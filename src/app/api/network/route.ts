import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const ALLOWED_STATUS = [
  "acquistato",
  "in_costruzione",
  "online",
  "fase_1",
  "fase_2",
  "fase_3",
] as const;

type Status = (typeof ALLOWED_STATUS)[number];

async function requireOwnerOrDev(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return { error: "unauthorized", status: 401 as const };
  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) return { error: "invalid_token", status: 401 as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "owner" && profile.role !== "dev")) {
    return { error: "forbidden", status: 403 as const };
  }
  return { supabase };
}

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("network_domains")
    .select("*")
    .order("country_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as {
    domain?: string;
    country_code?: string;
    country_name?: string;
    logo_url?: string | null;
    status?: string;
    notes?: string | null;
    launch_date?: string | null;
  } | null;

  if (!body?.domain || !body.country_code || !body.country_name) {
    return NextResponse.json(
      { error: "missing_fields", required: ["domain", "country_code", "country_name"] },
      { status: 400 },
    );
  }
  const status: Status = ALLOWED_STATUS.includes(body.status as Status)
    ? (body.status as Status)
    : "acquistato";

  const { data, error } = await auth.supabase
    .from("network_domains")
    .insert({
      domain: body.domain.trim().toLowerCase(),
      country_code: body.country_code.trim().toUpperCase().slice(0, 2),
      country_name: body.country_name.trim(),
      logo_url: body.logo_url?.trim() || null,
      status,
      notes: body.notes?.trim() || null,
      launch_date: body.launch_date || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
