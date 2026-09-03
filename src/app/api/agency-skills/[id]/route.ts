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

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.label === "string" && body.label.trim()) patch.label = body.label.trim();
  if (typeof body.slug === "string" && body.slug.trim())
    patch.slug = slugifySkill(body.slug.trim());
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order))
    patch.sort_order = body.sort_order;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("agency_skills")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const { error } = await auth.supabase.from("agency_skills").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
