import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { computePrice, DEFAULT_PRICING_SETTINGS, type PricingSettings } from "@/lib/pricing";

// GET /api/pricelist?domain_id=...
// Ritorna righe con dati SERP + volume/CPC uniti a label skill + prezzi
// calcolati usando pricing_settings globali.
export async function GET(req: NextRequest) {
  const domainId = new URL(req.url).searchParams.get("domain_id")?.trim();
  if (!domainId) {
    return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const [posRes, skillRes, settingsRes] = await Promise.all([
    supabase
      .from("matrice_serp_positions")
      .select(
        "area_type, area_slug, skill_slug, query, position, url, search_volume, cpc, checked_at, volume_updated_at",
      )
      .eq("domain_id", domainId),
    supabase
      .from("agency_skills")
      .select("slug, label")
      .eq("domain_id", domainId),
    supabase
      .from("pricing_settings")
      .select("markup, slot_1_pct, slot_2_pct, slot_3_pct, currency")
      .eq("id", "default")
      .maybeSingle(),
  ]);

  if (posRes.error)
    return NextResponse.json({ error: posRes.error.message }, { status: 500 });
  if (skillRes.error)
    return NextResponse.json({ error: skillRes.error.message }, { status: 500 });

  const skillLabel = new Map<string, string>();
  for (const s of skillRes.data ?? []) {
    const row = s as { slug: string; label: string };
    skillLabel.set(row.slug, row.label);
  }

  const settings: PricingSettings = (settingsRes.data as PricingSettings | null) ??
    DEFAULT_PRICING_SETTINGS;

  const capitalize = (s: string) =>
    s
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");

  const rows = (posRes.data ?? []).map((raw) => {
    const r = raw as {
      area_type: "regione" | "citta";
      area_slug: string;
      skill_slug: string;
      query: string;
      position: number | null;
      url: string | null;
      search_volume: number | null;
      cpc: number | null;
      checked_at: string;
      volume_updated_at: string | null;
    };
    const prices = computePrice(
      { position: r.position, search_volume: r.search_volume, cpc: r.cpc },
      settings,
    );
    return {
      area_type: r.area_type,
      area_slug: r.area_slug,
      area_label: capitalize(r.area_slug),
      skill_slug: r.skill_slug,
      skill_label: skillLabel.get(r.skill_slug) ?? r.skill_slug,
      query: r.query,
      position: r.position,
      url: r.url,
      search_volume: r.search_volume,
      cpc: r.cpc,
      checked_at: r.checked_at,
      volume_updated_at: r.volume_updated_at,
      ctr: prices.ctr,
      potential_ctr: prices.potential_ctr,
      base_price: prices.base_price,
      slot_1: prices.slot_1,
      slot_2: prices.slot_2,
      slot_3: prices.slot_3,
      potential_slot_1: prices.potential_slot_1,
    };
  });

  return NextResponse.json({ rows, settings });
}
