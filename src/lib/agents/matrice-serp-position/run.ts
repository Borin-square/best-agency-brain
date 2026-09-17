import type { AgentContext, AgentResult } from "../framework";
import {
  fetchSerpBatch,
  type SerpTaskInput,
} from "../agency-serp-position/sources/dataforseo";

const DEFAULT_BATCH_SIZE = 30;
const MAX_BATCH_SIZE = 200;
const DEFAULT_REFRESH_DAYS = 6;
const MIN_AGENCIES_PER_CELL = 5;

interface Cell {
  domain_id: string;
  area_type: "regione" | "citta";
  area_slug: string;
  skill_slug: string;
  skill_label: string;
  skill_modifier: string;
  area_label: string;
  query: string;
  agency_count: number;
  last_checked_at: string | null;
}

interface AgencyForAgg {
  citta: string | null;
  regioni: string | null;
  competenze_core: string[] | null;
  competenze_principali: string[] | null;
  altre_competenze: string[] | null;
}

// Capitalize slug: "reggio-emilia" → "Reggio Emilia".
function capitalize(s: string): string {
  return s
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchAgenciesForAgg(
  ctx: AgentContext,
  domainId: string,
): Promise<AgencyForAgg[]> {
  const all: AgencyForAgg[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select("citta, regioni, competenze_core, competenze_principali, altre_competenze")
      .eq("domain_id", domainId)
      .neq("publish_status", "trash")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetch_agencies: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as AgencyForAgg[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// Aggrega count agenzie per (area, skill). Considera sia città sia regione,
// e union delle 3 liste competenze.
function aggregateCells(
  agencies: AgencyForAgg[],
): Array<{ area_type: "regione" | "citta"; area_slug: string; skill_slug: string; count: number }> {
  const counts = new Map<string, number>();

  for (const a of agencies) {
    const skillsUnion = new Set<string>();
    for (const arr of [a.competenze_core, a.competenze_principali, a.altre_competenze]) {
      if (Array.isArray(arr)) for (const s of arr) if (typeof s === "string" && s) skillsUnion.add(s);
    }
    if (skillsUnion.size === 0) continue;

    const areas: Array<{ type: "regione" | "citta"; slug: string }> = [];
    if (a.regioni) areas.push({ type: "regione", slug: a.regioni });
    if (a.citta) areas.push({ type: "citta", slug: a.citta });

    for (const area of areas) {
      for (const skill of skillsUnion) {
        const key = `${area.type}|${area.slug}|${skill}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()].map(([key, count]) => {
    const [area_type, area_slug, skill_slug] = key.split("|");
    return {
      area_type: area_type as "regione" | "citta",
      area_slug,
      skill_slug,
      count,
    };
  });
}

async function pickCells(
  ctx: AgentContext,
  batchSize: number,
  refreshDays: number,
): Promise<Cell[]> {
  const { domainId } = ctx.filters;
  if (!domainId) {
    // Cron globale: itera sui domini attivi (per ora solo miglioreagenzia.it)
    const { data: activeDomains, error } = await ctx.supabase
      .from("network_domains")
      .select("id")
      .in("status", ["online", "fase_1", "fase_2", "fase_3"]);
    if (error) throw new Error(`active_domains: ${error.message}`);
    const activeIds = (activeDomains ?? []).map((d) => d.id as string);
    if (activeIds.length === 0) return [];
    // Chiamata ricorsiva per ogni dominio, con budget batchSize globale distribuito
    const allCells: Cell[] = [];
    for (const dId of activeIds) {
      const remaining = batchSize - allCells.length;
      if (remaining <= 0) break;
      const cells = await pickCellsForDomain(ctx, dId, remaining, refreshDays);
      allCells.push(...cells);
    }
    return allCells;
  }
  return pickCellsForDomain(ctx, domainId, batchSize, refreshDays);
}

async function pickCellsForDomain(
  ctx: AgentContext,
  domainId: string,
  batchSize: number,
  refreshDays: number,
): Promise<Cell[]> {
  // 1. Aggrega agenzie per (area, skill) e filtra count >= MIN_AGENCIES_PER_CELL
  const agencies = await fetchAgenciesForAgg(ctx, domainId);
  const raw = aggregateCells(agencies).filter((c) => c.count >= MIN_AGENCIES_PER_CELL);

  if (raw.length === 0) {
    ctx.log("no_valid_cells", { domain_id: domainId, min_agencies: MIN_AGENCIES_PER_CELL });
    return [];
  }

  // 2. Load skill labels + modifiers per il dominio
  const { data: skillRows, error: skErr } = await ctx.supabase
    .from("agency_skills")
    .select("slug, label, query_modifier")
    .eq("domain_id", domainId);
  if (skErr) throw new Error(`skills: ${skErr.message}`);
  const skillsBySlug = new Map<string, { label: string; modifier: string }>();
  for (const s of skillRows ?? []) {
    const row = s as { slug: string; label: string; query_modifier: string | null };
    skillsBySlug.set(row.slug, {
      label: row.label,
      modifier: row.query_modifier ?? "agenzia",
    });
  }

  // 3. Load last checked_at per cella (per rispettare refresh_days)
  const { data: existing, error: exErr } = await ctx.supabase
    .from("matrice_serp_positions")
    .select("area_type, area_slug, skill_slug, checked_at")
    .eq("domain_id", domainId);
  if (exErr) throw new Error(`existing: ${exErr.message}`);
  const lastCheck = new Map<string, string>();
  for (const row of existing ?? []) {
    const r = row as { area_type: string; area_slug: string; skill_slug: string; checked_at: string };
    lastCheck.set(`${r.area_type}|${r.area_slug}|${r.skill_slug}`, r.checked_at);
  }

  // 4. Costruisce le cell → filtra quelle che rispettano refresh_days → costruisce query
  const cutoffMs = Date.now() - refreshDays * 24 * 60 * 60 * 1000;
  const candidates: Cell[] = [];

  for (const c of raw) {
    // Skip se skill non presente nella tassonomia agency_skills del dominio
    const skill = skillsBySlug.get(c.skill_slug);
    if (!skill) continue;

    const lastAt = lastCheck.get(`${c.area_type}|${c.area_slug}|${c.skill_slug}`);
    if (lastAt && new Date(lastAt).getTime() > cutoffMs) continue; // già fresca

    const skill_label = skill.label;
    const skill_modifier = skill.modifier;
    const area_label = capitalize(c.area_slug);
    const query = `${skill_modifier} ${skill_label} ${area_label}`.trim().replace(/\s+/g, " ");

    candidates.push({
      domain_id: domainId,
      area_type: c.area_type,
      area_slug: c.area_slug,
      skill_slug: c.skill_slug,
      skill_label,
      skill_modifier,
      area_label,
      query,
      agency_count: c.count,
      last_checked_at: lastAt ?? null,
    });
  }

  // 5. Ordina oldest first (null = never checked, priorità massima)
  candidates.sort((a, b) => {
    if (!a.last_checked_at && b.last_checked_at) return -1;
    if (a.last_checked_at && !b.last_checked_at) return 1;
    if (!a.last_checked_at && !b.last_checked_at) return 0;
    return new Date(a.last_checked_at!).getTime() - new Date(b.last_checked_at!).getTime();
  });

  return candidates.slice(0, batchSize);
}

export async function runMatriceSerpPosition(ctx: AgentContext): Promise<AgentResult> {
  const refreshDays = ctx.overrides.refreshDays ?? DEFAULT_REFRESH_DAYS;
  const requestedBatch = ctx.overrides.batchSize ?? DEFAULT_BATCH_SIZE;
  const batchSize = Math.max(1, Math.min(MAX_BATCH_SIZE, requestedBatch));

  ctx.log("start", {
    batchSize,
    refreshDays,
    min_agencies: MIN_AGENCIES_PER_CELL,
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

  let cells: Cell[];
  try {
    cells = await pickCells(ctx, batchSize, refreshDays);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log("pick_cells_error", { error: msg });
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: msg },
    };
  }

  if (cells.length === 0) {
    ctx.log("no_cells_to_scan");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  ctx.log("batch_selected", { count: cells.length });

  // Costruisce input SERP: refId = "cellKey" per remapping response → cella
  const cellByKey = new Map<string, Cell>();
  const inputs: SerpTaskInput[] = cells.map((c) => {
    const key = `${c.domain_id}|${c.area_type}|${c.area_slug}|${c.skill_slug}`;
    cellByKey.set(key, c);
    return { refId: key, keyword: c.query };
  });

  let results;
  try {
    results = await fetchSerpBatch(inputs);
    ctx.log("api_completed", { count: results.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log("api_error", { error: msg });
    return {
      status: "error",
      rowsProcessed: cells.length,
      rowsSuccess: 0,
      rowsError: cells.length,
      meta: { error: msg },
    };
  }

  const now = new Date().toISOString();
  let success = 0;
  let errorCount = 0;
  const buckets = { top10: 0, top30: 0, top100: 0, notFound: 0 };

  for (const result of results) {
    const cell = cellByKey.get(result.refId);
    if (!cell) {
      errorCount++;
      continue;
    }

    if (result.error) {
      errorCount++;
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: null, // no agency per matrice cells
        status: "error",
        sources_hit: {
          area_type: cell.area_type,
          area_slug: cell.area_slug,
          skill_slug: cell.skill_slug,
          query: cell.query,
        },
        errors: { message: result.error },
      });
      continue;
    }

    if (result.position !== null) {
      if (result.position <= 10) buckets.top10++;
      else if (result.position <= 30) buckets.top30++;
      else buckets.top100++;
    } else {
      buckets.notFound++;
    }

    // Upsert current state
    const { error: upErr } = await ctx.supabase
      .from("matrice_serp_positions")
      .upsert(
        {
          domain_id: cell.domain_id,
          area_type: cell.area_type,
          area_slug: cell.area_slug,
          skill_slug: cell.skill_slug,
          query: cell.query,
          position: result.position,
          url: result.url,
          provider: "dataforseo",
          checked_at: now,
        },
        { onConflict: "domain_id,area_type,area_slug,skill_slug" },
      );

    if (upErr) {
      errorCount++;
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: null,
        status: "error",
        errors: { message: `upsert: ${upErr.message}` },
      });
      continue;
    }

    // Snapshot storico (append-only)
    await ctx.supabase.from("matrice_serp_snapshots").insert({
      domain_id: cell.domain_id,
      area_type: cell.area_type,
      area_slug: cell.area_slug,
      skill_slug: cell.skill_slug,
      query: cell.query,
      position: result.position,
      url: result.url,
      provider: "dataforseo",
      checked_at: now,
    });

    await ctx.supabase.from("agent_run_items").insert({
      run_id: ctx.runId,
      agency_id: null,
      status: "success",
      sources_hit: {
        area_type: cell.area_type,
        area_slug: cell.area_slug,
        skill_slug: cell.skill_slug,
        query: cell.query,
        position: result.position,
        agency_count: cell.agency_count,
      },
      fields_updated: ["position", "url", "checked_at"],
    });

    success++;
  }

  const summary = {
    cells_processed: cells.length,
    api_batch_size: inputs.length,
    top_10: buckets.top10,
    top_30: buckets.top30,
    top_100: buckets.top100,
    not_found: buckets.notFound,
    errors: errorCount,
    min_agencies_per_cell: MIN_AGENCIES_PER_CELL,
  };

  ctx.log("batch_complete", summary);

  return {
    status: errorCount === 0 ? "success" : success > 0 ? "partial" : "error",
    rowsProcessed: cells.length,
    rowsSuccess: success,
    rowsError: errorCount,
    meta: { run_summary: summary },
  };
}
