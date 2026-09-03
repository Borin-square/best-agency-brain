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
  if (typeof body.domain === "string") patch.domain = body.domain.trim().toLowerCase();
  if (typeof body.country_code === "string")
    patch.country_code = body.country_code.trim().toUpperCase().slice(0, 2);
  if (typeof body.country_name === "string") patch.country_name = body.country_name.trim();
  if ("logo_url" in body)
    patch.logo_url = typeof body.logo_url === "string" && body.logo_url.trim() ? body.logo_url.trim() : null;
  if (typeof body.status === "string" && ALLOWED_STATUS.includes(body.status as (typeof ALLOWED_STATUS)[number]))
    patch.status = body.status;
  if ("notes" in body)
    patch.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  if ("launch_date" in body)
    patch.launch_date = typeof body.launch_date === "string" && body.launch_date ? body.launch_date : null;
  if ("starred_areas" in body) {
    // Formato accettato: [{ type: 'regione'|'citta', slug: string }]
    const raw = Array.isArray(body.starred_areas) ? body.starred_areas : [];
    const seen = new Set<string>();
    const clean: Array<{ type: "regione" | "citta"; slug: string }> = [];
    for (const item of raw) {
      const o = item as { type?: unknown; slug?: unknown };
      if (
        (o.type === "regione" || o.type === "citta") &&
        typeof o.slug === "string" &&
        o.slug.trim()
      ) {
        const key = `${o.type}:${o.slug.trim().toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        clean.push({ type: o.type, slug: o.slug.trim().toLowerCase() });
      }
    }
    patch.starred_areas = clean;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("network_domains")
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
  const { error } = await auth.supabase.from("network_domains").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
