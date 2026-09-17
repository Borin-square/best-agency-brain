import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Retention IP: dopo 30 giorni azzera il campo ip (raw) su pageviews e
// sessions. Il campo ip_truncated (/24) resta per statistiche/aggregazioni.
// Autenticazione: CRON_SECRET, come cron/dispatch.

export const runtime = "nodejs";
export const maxDuration = 60;

const RETENTION_DAYS = 30;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [pvRes, sessRes] = await Promise.all([
    supabase
      .from("radar_pageviews")
      .update({ ip: null })
      .lt("created_at", cutoff)
      .not("ip", "is", null)
      .select("id"),
    supabase
      .from("radar_sessions")
      .update({ ip: null })
      .lt("first_seen_at", cutoff)
      .not("ip", "is", null)
      .select("session_key"),
  ]);

  return NextResponse.json({
    ok: true,
    cutoff,
    pageviews_truncated: pvRes.data?.length ?? 0,
    sessions_truncated: sessRes.data?.length ?? 0,
    errors: [pvRes.error?.message, sessRes.error?.message].filter(Boolean),
  });
}
