import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { slugifySkill } from "@/lib/agency-skills";

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

export async function GET(req: NextRequest) {
  const domainId = new URL(req.url).searchParams.get("domain_id")?.trim();
  if (!domainId) {
    return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agency_skills")
    .select("*")
    .eq("domain_id", domainId)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as {
    domain_id?: string;
    label?: string;
    slug?: string;
    sort_order?: number;
  } | null;

  if (!body?.domain_id || !body.label?.trim()) {
    return NextResponse.json(
      { error: "missing_fields", required: ["domain_id", "label"] },
      { status: 400 },
    );
  }
  const label = body.label.trim();
  const slug = (body.slug?.trim() || slugifySkill(label)).toLowerCase();
  if (!slug) return NextResponse.json({ error: "invalid_label" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("agency_skills")
    .insert({
      domain_id: body.domain_id,
      slug,
      label,
      sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
