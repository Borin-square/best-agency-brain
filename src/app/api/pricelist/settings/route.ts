import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireStaff } from "@/lib/api-auth";
import { DEFAULT_PRICING_SETTINGS } from "@/lib/pricing";

// GET: settings correnti (lettura pubblica staff)
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("markup, slot_1_pct, slot_2_pct, slot_3_pct, currency, updated_at")
    .eq("id", "default")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data ?? DEFAULT_PRICING_SETTINGS });
}

// PUT: aggiorna settings (solo owner/dev).
export async function PUT(req: NextRequest) {
  const auth = await requireStaff(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.role !== "owner" && auth.role !== "dev") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    markup?: number;
    slot_1_pct?: number;
    slot_2_pct?: number;
    slot_3_pct?: number;
    currency?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.markup === "number" && body.markup > 0) patch.markup = body.markup;
  if (typeof body.slot_1_pct === "number" && body.slot_1_pct >= 0 && body.slot_1_pct <= 2)
    patch.slot_1_pct = body.slot_1_pct;
  if (typeof body.slot_2_pct === "number" && body.slot_2_pct >= 0 && body.slot_2_pct <= 2)
    patch.slot_2_pct = body.slot_2_pct;
  if (typeof body.slot_3_pct === "number" && body.slot_3_pct >= 0 && body.slot_3_pct <= 2)
    patch.slot_3_pct = body.slot_3_pct;
  if (typeof body.currency === "string" && body.currency.length >= 2 && body.currency.length <= 4)
    patch.currency = body.currency.toUpperCase();

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pricing_settings")
    .update(patch)
    .eq("id", "default")
    .select("markup, slot_1_pct, slot_2_pct, slot_3_pct, currency, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
