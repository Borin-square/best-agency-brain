import type { AgentContext, AgentResult } from "../framework";
import { lookupAbstractIp } from "./sources/abstract-ip";
import { reverseDns } from "./sources/reverse-dns";

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 200;
const AGENCY_MATCH_THRESHOLD = 0.55; // sotto → non consideriamo match

interface AgencyLite {
  id: string;
  title: string;
  sito_web: string | null;
}

interface SessionRow {
  session_key: string;
  ip: string | null;
  user_agent: string | null;
}

// Estrae il dominio root da una stringa host, es.
//  "mail.acme-agency.it" → "acme-agency.it"
//  "server-42.hosting.example.co.uk" → "example.co.uk" (best-effort)
function rootDomain(host: string | null | undefined): string | null {
  if (!host) return null;
  const clean = host.replace(/\.$/, "").toLowerCase();
  const parts = clean.split(".");
  if (parts.length < 2) return null;
  // 2-label TLDs comuni (.co.uk, .com.au, ...) — heuristica minimale
  const twoLabelTlds = new Set(["co.uk", "co.jp", "com.au", "com.br", "com.mx", "co.nz"]);
  const last2 = parts.slice(-2).join(".");
  const last3 = parts.slice(-3).join(".");
  if (parts.length >= 3 && twoLabelTlds.has(last2)) return last3;
  return last2;
}

function extractDomainFromWebsite(website: string | null): string | null {
  if (!website) return null;
  let raw = website.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`;
  try {
    return rootDomain(new URL(raw).host);
  } catch {
    return null;
  }
}

// Normalizza stringa per fuzzy match: lowercase, alfanumerici, single space.
function norm(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[^a-z0-9àèéìòù\s]/g, " ")
    .replace(/\b(s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?a\.?s\.?|snc|srls|agenzia|agency|studio|group|digital|marketing|web)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Similarity Jaccard su token — non serve dependency.
function tokenSimilarity(a: string, b: string): number {
  const ta = new Set(a.split(" ").filter(Boolean));
  const tb = new Set(b.split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = new Set([...ta, ...tb]).size;
  return inter / union;
}

interface MatchResult {
  agency_id: string;
  score: number;
  reason: "domain" | "reverse_dns" | "name_fuzzy";
}

function matchAgency(
  agencies: AgencyLite[],
  agencyDomains: Map<string, string>, // domain → agency_id
  reverseDnsHost: string | null,
  orgName: string | null,
): MatchResult | null {
  // 1. Match esatto via reverse DNS root domain → agency sito_web root
  const revRoot = rootDomain(reverseDnsHost);
  if (revRoot && agencyDomains.has(revRoot)) {
    return { agency_id: agencyDomains.get(revRoot)!, score: 1.0, reason: "reverse_dns" };
  }

  // 2. Fuzzy su org name → agency title
  if (orgName) {
    const orgNorm = norm(orgName);
    if (orgNorm.length >= 3) {
      let best: MatchResult | null = null;
      for (const a of agencies) {
        const titleNorm = norm(a.title);
        if (!titleNorm) continue;
        const sim = tokenSimilarity(orgNorm, titleNorm);
        if (sim >= AGENCY_MATCH_THRESHOLD && (!best || sim > best.score)) {
          best = { agency_id: a.id, score: sim, reason: "name_fuzzy" };
        }
      }
      if (best) return best;
    }
  }

  return null;
}

export async function runRadarEnricher(ctx: AgentContext): Promise<AgentResult> {
  const requestedBatch = ctx.overrides.batchSize ?? DEFAULT_BATCH_SIZE;
  const batchSize = Math.max(1, Math.min(MAX_BATCH_SIZE, requestedBatch));

  ctx.log("start", { batchSize, filters: ctx.filters });

  if (!process.env.ABSTRACT_API_KEY) {
    ctx.log("missing_credentials");
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: "ABSTRACT_API_KEY missing" },
    };
  }

  // 1. Carica sessioni non arricchite (con IP ancora presente)
  const { data: sessions, error: sessErr } = await ctx.supabase
    .from("radar_sessions")
    .select("session_key, ip, user_agent")
    .is("enriched_at", null)
    .not("ip", "is", null)
    .order("first_seen_at", { ascending: true })
    .limit(batchSize);

  if (sessErr) {
    ctx.log("load_sessions_error", { error: sessErr.message });
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: sessErr.message },
    };
  }

  const list = (sessions ?? []) as SessionRow[];
  if (list.length === 0) {
    ctx.log("no_sessions_to_enrich");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  // 2. Carica agenzie (per matching) — dominio corrente (se filtro) o tutte
  let agencyQuery = ctx.supabase
    .from("agencies")
    .select("id, title, sito_web")
    .neq("publish_status", "trash");
  if (ctx.filters.domainId) agencyQuery = agencyQuery.eq("domain_id", ctx.filters.domainId);

  const { data: agenciesRaw, error: aggErr } = await agencyQuery;
  if (aggErr) {
    ctx.log("load_agencies_error", { error: aggErr.message });
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: aggErr.message },
    };
  }

  const agencies = (agenciesRaw ?? []) as AgencyLite[];
  const agencyDomains = new Map<string, string>();
  for (const a of agencies) {
    const d = extractDomainFromWebsite(a.sito_web);
    if (d) agencyDomains.set(d, a.id);
  }

  ctx.log("loaded", { sessions: list.length, agencies: agencies.length });

  const now = new Date().toISOString();
  let success = 0;
  let errorCount = 0;
  let matched = 0;

  for (const s of list) {
    if (!s.ip) {
      errorCount++;
      continue;
    }

    try {
      // Reverse DNS + AbstractAPI in parallelo
      const [revHost, ipInfo] = await Promise.all([
        reverseDns(s.ip),
        lookupAbstractIp(s.ip),
      ]);

      const orgName = ipInfo.organization || ipInfo.isp || ipInfo.as_org || null;
      const match = matchAgency(agencies, agencyDomains, revHost, orgName);

      const patch = {
        enriched_at: now,
        enrich_error: null,
        company_name: orgName,
        company_domain: rootDomain(revHost) ?? null,
        company_type: null,
        org: ipInfo.organization ?? ipInfo.isp ?? null,
        asn: ipInfo.asn,
        reverse_dns: revHost,
        country: ipInfo.country,
        city: ipInfo.city,
        matched_agency_id: match?.agency_id ?? null,
        match_score: match?.score ?? null,
        match_reason: match?.reason ?? null,
      };

      const { error: upErr } = await ctx.supabase
        .from("radar_sessions")
        .update(patch)
        .eq("session_key", s.session_key);

      if (upErr) {
        errorCount++;
        await ctx.supabase.from("agent_run_items").insert({
          run_id: ctx.runId,
          agency_id: null,
          status: "error",
          sources_hit: { ip: s.ip },
          errors: { message: `update: ${upErr.message}` },
        });
        continue;
      }

      if (match) matched++;
      success++;

      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: match?.agency_id ?? null,
        status: "success",
        sources_hit: {
          ip: s.ip,
          reverse_dns: revHost,
          org: orgName,
          asn: ipInfo.asn,
          match: match ?? null,
        },
        fields_updated: ["enriched_at", "company_name", "org", "asn", "reverse_dns", "country", "city"],
      });
    } catch (err) {
      errorCount++;
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.supabase
        .from("radar_sessions")
        .update({ enriched_at: now, enrich_error: msg })
        .eq("session_key", s.session_key);
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: null,
        status: "error",
        sources_hit: { ip: s.ip },
        errors: { message: msg },
      });
    }
  }

  ctx.log("batch_complete", { processed: list.length, success, matched, errors: errorCount });

  return {
    status: errorCount === 0 ? "success" : success > 0 ? "partial" : "error",
    rowsProcessed: list.length,
    rowsSuccess: success,
    rowsError: errorCount,
    meta: { matched_agencies: matched },
  };
}
