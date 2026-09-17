import type { AgentContext, AgentResult } from "../framework";
import { fetchSerpBatch, type SerpTaskInput, type SerpTaskResult } from "./sources/dataforseo";

const DEFAULT_BATCH_SIZE = 100; // max DataForSEO POST size
const MAX_BATCH_SIZE = 100;
const DEFAULT_REFRESH_DAYS = 6;

interface AgencyRow {
  id: string;
  title: string;
  citta: string | null;
  serp_checked_at: string | null;
}

// Capitalizza slug città per query più human-readable (ancona → Ancona).
function prettyCity(citta: string | null): string {
  if (!citta) return "";
  return citta
    .split(/[\s-]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function pickAgencies(
  ctx: AgentContext,
  batchSize: number,
  refreshDays: number,
): Promise<AgencyRow[] | null> {
  const { agencyIds, domainId } = ctx.filters;
  const SELECT = "id, title, citta, serp_checked_at";

  // 1. Selezione manuale
  if (agencyIds && agencyIds.length > 0) {
    const capped = agencyIds.slice(0, batchSize);
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select(SELECT)
      .in("id", capped)
      .returns<AgencyRow[]>();
    if (error) {
      ctx.log("select_error", { error: error.message, mode: "manual_ids" });
      return null;
    }
    return data ?? [];
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - refreshDays);

  // 2. Filtro dominio singolo
  // Perimetro: solo agenzie con publish_status='publish' (già live su WP,
  // ha senso misurare la loro posizione).
  if (domainId) {
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select(SELECT)
      .eq("domain_id", domainId)
      .eq("publish_status", "publish")
      .or(`serp_checked_at.is.null,serp_checked_at.lt.${cutoff.toISOString()}`)
      .order("serp_checked_at", { ascending: true, nullsFirst: true })
      .limit(batchSize)
      .returns<AgencyRow[]>();
    if (error) {
      ctx.log("select_error", { error: error.message, mode: "domain" });
      return null;
    }
    return data ?? [];
  }

  // 3. Cron globale: solo domini attivi
  const { data: activeDomains, error: domErr } = await ctx.supabase
    .from("network_domains")
    .select("id")
    .in("status", ["online", "fase_1", "fase_2", "fase_3"]);
  if (domErr) {
    ctx.log("select_error", { error: domErr.message, mode: "active_domains" });
    return null;
  }
  const activeIds = (activeDomains ?? []).map((d) => d.id as string);
  if (activeIds.length === 0) {
    ctx.log("no_active_domains");
    return [];
  }
  const { data, error } = await ctx.supabase
    .from("agencies")
    .select(SELECT)
    .in("domain_id", activeIds)
    .eq("publish_status", "publish")
    .or(`serp_checked_at.is.null,serp_checked_at.lt.${cutoff.toISOString()}`)
    .order("serp_checked_at", { ascending: true, nullsFirst: true })
    .limit(batchSize)
    .returns<AgencyRow[]>();
  if (error) {
    ctx.log("select_error", { error: error.message, mode: "global" });
    return null;
  }
  return data ?? [];
}

export async function runAgencySerpPosition(ctx: AgentContext): Promise<AgentResult> {
  const refreshDays = ctx.overrides.refreshDays ?? DEFAULT_REFRESH_DAYS;
  const requestedBatch = ctx.overrides.batchSize ?? DEFAULT_BATCH_SIZE;
  const batchSize = Math.max(1, Math.min(MAX_BATCH_SIZE, requestedBatch));

  ctx.log("start", {
    batchSize,
    refreshDays,
    filters: ctx.filters,
  });

  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    ctx.log("missing_credentials");
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: "DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD missing" },
    };
  }

  const agencies = await pickAgencies(ctx, batchSize, refreshDays);
  if (agencies === null) {
    return { status: "error", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }
  if (agencies.length === 0) {
    ctx.log("no_agencies_to_scan");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  ctx.log("batch_selected", { count: agencies.length });

  // Costruisce input SERP: keyword = "{title} {città capitalizzata}"
  const inputs: SerpTaskInput[] = agencies
    .map((a) => {
      const city = prettyCity(a.citta);
      const keyword = city ? `${a.title} ${city}` : a.title;
      return { refId: a.id, keyword };
    })
    // Skip agenzie senza title (safety)
    .filter((i) => i.keyword.trim().length > 0);

  // API call unica per l'intero batch
  let results: SerpTaskResult[];
  try {
    results = await fetchSerpBatch(inputs);
    ctx.log("api_completed", { count: results.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log("api_error", { error: msg });
    return {
      status: "error",
      rowsProcessed: agencies.length,
      rowsSuccess: 0,
      rowsError: agencies.length,
      meta: { error: msg },
    };
  }

  const now = new Date().toISOString();
  const resultsByRefId = new Map<string, SerpTaskResult>();
  for (const r of results) resultsByRefId.set(r.refId, r);

  let success = 0;
  let errorCount = 0;
  let foundInSerp = 0;
  const positionBuckets = { top10: 0, top30: 0, top100: 0, notFound: 0 };

  for (const agency of agencies) {
    const itemStart = Date.now();
    const result = resultsByRefId.get(agency.id);

    if (!result) {
      errorCount++;
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: "error",
        errors: { message: "no_result_for_agency" },
        duration_ms: Date.now() - itemStart,
      });
      continue;
    }

    if (result.error) {
      errorCount++;
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: "error",
        sources_hit: { serp_query: result.keyword },
        errors: { message: result.error },
        duration_ms: Date.now() - itemStart,
      });
      continue;
    }

    if (result.position !== null) {
      foundInSerp++;
      if (result.position <= 10) positionBuckets.top10++;
      else if (result.position <= 30) positionBuckets.top30++;
      else positionBuckets.top100++;
    } else {
      positionBuckets.notFound++;
    }

    // Update agencies (flat state)
    const { error: updErr } = await ctx.supabase
      .from("agencies")
      .update({
        serp_position: result.position, // null = fuori top 100 / non trovata
        serp_query: result.keyword,
        serp_url: result.url,
        serp_checked_at: now,
      })
      .eq("id", agency.id);
    if (updErr) {
      errorCount++;
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: "error",
        errors: { message: `db_update: ${updErr.message}` },
        duration_ms: Date.now() - itemStart,
      });
      continue;
    }

    // Insert snapshot storico (append-only per trend)
    await ctx.supabase.from("agency_serp_snapshots").insert({
      agency_id: agency.id,
      checked_at: now,
      query: result.keyword,
      position: result.position,
      url: result.url,
      location: "Italy",
      provider: "dataforseo",
    });

    await ctx.supabase.from("agent_run_items").insert({
      run_id: ctx.runId,
      agency_id: agency.id,
      status: "success",
      sources_hit: {
        serp_query: result.keyword,
        position: result.position,
        found: result.position !== null,
      },
      fields_updated: ["serp_position", "serp_query", "serp_url", "serp_checked_at"],
      duration_ms: Date.now() - itemStart,
    });

    success++;
  }

  const summary = {
    agencies_processed: agencies.length,
    api_batch_size: inputs.length,
    found_in_serp: foundInSerp,
    not_found: agencies.length - foundInSerp - errorCount,
    top_10: positionBuckets.top10,
    top_30: positionBuckets.top30,
    top_100: positionBuckets.top100,
    errors: errorCount,
  };

  ctx.log("batch_complete", summary);

  return {
    status: errorCount === 0 ? "success" : success > 0 ? "partial" : "error",
    rowsProcessed: agencies.length,
    rowsSuccess: success,
    rowsError: errorCount,
    meta: { run_summary: summary },
  };
}
