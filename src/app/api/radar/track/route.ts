import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Endpoint pubblico chiamato dallo snippet JS installato sul sito trackato
// (es. miglioreagenzia.it). Estrae l'IP dagli header di Vercel, registra
// una pageview e upsert la session giornaliera (IP + giorno).
//
// CORS aperto (Access-Control-Allow-Origin: *) perché la lista dei siti
// del network cresce e non vogliamo mantenere una whitelist qui.
// Il rischio è limitato: chiunque può POSTare pageviews, ma senza IP di
// un vero visitatore l'inserimento è innocuo (e limitiamo comunque per IP).

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function extractIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const xreal = req.headers.get("x-real-ip");
  if (xreal) return xreal.trim();
  return null;
}

function truncateIp(ip: string): string | null {
  // IPv4 → primi 3 ottetti + .0/24
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  // IPv6 → primi 48 bit
  if (ip.includes(":")) {
    const groups = ip.split(":").slice(0, 3).join(":");
    return `${groups}::/48`;
  }
  return null;
}

function todayIso(): string {
  // YYYY-MM-DD in UTC (per session_key stabile globalmente)
  return new Date().toISOString().slice(0, 10);
}

async function resolveDomainId(
  supabase: ReturnType<typeof createServiceClient>,
  hostFromReferrer: string | null,
): Promise<string | null> {
  if (!hostFromReferrer) return null;
  const clean = hostFromReferrer.replace(/^www\./i, "").toLowerCase();
  const { data } = await supabase
    .from("network_domains")
    .select("id")
    .eq("domain", clean)
    .maybeSingle();
  return (data?.id as string | null) ?? null;
}

function hostFromUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    return new URL(u).host;
  } catch {
    return null;
  }
}

function pathFromUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    return new URL(u).pathname;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = extractIp(req);
  if (!ip) {
    return NextResponse.json(
      { ok: false, reason: "no_ip" },
      { status: 200, headers: CORS_HEADERS },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    url?: string;
    referrer?: string;
  } | null;

  const url = body?.url && typeof body.url === "string" ? body.url.slice(0, 500) : null;
  const referrer =
    body?.referrer && typeof body.referrer === "string"
      ? body.referrer.slice(0, 500)
      : null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const supabase = createServiceClient();

  const host = hostFromUrl(url);
  const domainId = await resolveDomainId(supabase, host);

  const day = todayIso();
  const sessionKey = `${ip}|${day}`;
  const truncated = truncateIp(ip);
  const path = pathFromUrl(url);

  // Pageview raw
  await supabase.from("radar_pageviews").insert({
    domain_id: domainId,
    session_key: sessionKey,
    ip,
    ip_truncated: truncated,
    url,
    path,
    referrer,
    user_agent: userAgent,
  });

  // Upsert session (increment pageviews_count via RPC-like pattern:
  // proviamo insert; se esiste, facciamo update incrementale).
  const nowIso = new Date().toISOString();
  const { error: insErr } = await supabase.from("radar_sessions").insert({
    session_key: sessionKey,
    domain_id: domainId,
    ip,
    ip_truncated: truncated,
    day,
    first_seen_at: nowIso,
    last_seen_at: nowIso,
    pageviews_count: 1,
    user_agent: userAgent,
  });

  if (insErr) {
    // 23505 = unique_violation → sessione già esistente, incrementa
    const isConflict = String((insErr as { code?: string }).code ?? "").startsWith("23");
    if (isConflict) {
      const { data: cur } = await supabase
        .from("radar_sessions")
        .select("pageviews_count")
        .eq("session_key", sessionKey)
        .single();
      await supabase
        .from("radar_sessions")
        .update({
          pageviews_count: (cur?.pageviews_count ?? 0) + 1,
          last_seen_at: nowIso,
        })
        .eq("session_key", sessionKey);
    } else {
      return NextResponse.json(
        { ok: false, error: insErr.message },
        { status: 500, headers: CORS_HEADERS },
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS });
}
