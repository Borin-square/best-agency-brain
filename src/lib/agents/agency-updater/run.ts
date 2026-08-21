import type { AgentContext, AgentResult } from "../framework";
import { findPlace, type PlacesResult } from "./sources/google-places";
import { scrapeWebsite, type ScrapeResult } from "./sources/website-scrape";
import { extractFromWebsite, type LlmExtraction } from "./sources/llm-extract";
import { resolveItalianAddress } from "./sources/geo-resolver";

const BATCH_SIZE = 15; // scrape + LLM per agenzia ~10s → 15 × 10s = 150s < 300s (Hobby limit)
const MAX_MANUAL_IDS = 30; // limite hard su selezione manuale per non sforare timeout
const REFRESH_DAYS = 30;

// Solo domini con status "attivo" vengono arricchiti dal cron globale.
const ACTIVE_DOMAIN_STATUSES = ["online", "fase_1", "fase_2", "fase_3"] as const;

// L'LLM riempie i buchi (rispetta curatela) tranne descrizione_breve + content
// che vengono SEMPRE sovrascritti quando disponibili — obiettivo: descrizioni
// di qualità uniforme scritte dall'LLM sulla base del sito.
const LLM_FILL_IF_EMPTY = [
  "competenze",
  "caratteristiche",
  "anno_di_fondazione",
  "dimensione_team",
  "partita_iva",
  "lingue",
  "fascia_di_prezzo",
  "email",
  "telefono",
  "linkedin",
  "instagram",
  "behance",
  "indirizzo_completo",
] as const;

const LLM_ALWAYS_OVERWRITE = ["descrizione_breve", "content"] as const;

type LlmFillField = (typeof LLM_FILL_IF_EMPTY)[number];

interface AgencyRow {
  id: string;
  wp_id: number | null;
  title: string;
  citta: string | null;
  sito_web: string | null;
  partita_iva: string | null;
  google_place_id: string | null;
  google_sito: string | null;
  last_enriched_at: string | null;
  descrizione_breve: string | null;
  content: string | null;
  competenze: string[] | null;
  caratteristiche: string[] | null;
  anno_di_fondazione: number | null;
  dimensione_team: string | null;
  lingue: string[] | null;
  fascia_di_prezzo: string | null;
  email: string | null;
  telefono: string | null;
  linkedin: string | null;
  instagram: string | null;
  behance: string | null;
  indirizzo_completo: string | null;
}

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

const AGENCY_SELECT =
  "id, wp_id, title, citta, sito_web, partita_iva, google_place_id, google_sito, last_enriched_at, descrizione_breve, content, competenze, caratteristiche, anno_di_fondazione, dimensione_team, lingue, fascia_di_prezzo, email, telefono, linkedin, instagram, behance, indirizzo_completo";

async function pickAgencies(ctx: AgentContext): Promise<AgencyRow[] | null> {
  const { agencyIds, domainId } = ctx.filters;

  // 1. Selezione manuale: ids espliciti (cap a MAX_MANUAL_IDS)
  if (agencyIds && agencyIds.length > 0) {
    const capped = agencyIds.slice(0, MAX_MANUAL_IDS);
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select(AGENCY_SELECT)
      .in("id", capped)
      .returns<AgencyRow[]>();
    if (error) {
      ctx.log("select_error", { error: error.message, mode: "manual_ids" });
      return null;
    }
    return data ?? [];
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REFRESH_DAYS);

  // 2. Filtro dominio singolo
  if (domainId) {
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select(AGENCY_SELECT)
      .eq("domain_id", domainId)
      .or(`last_enriched_at.is.null,last_enriched_at.lt.${cutoff.toISOString()}`)
      .neq("publish_status", "trash")
      .order("last_enriched_at", { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE)
      .returns<AgencyRow[]>();
    if (error) {
      ctx.log("select_error", { error: error.message, mode: "domain" });
      return null;
    }
    return data ?? [];
  }

  // 3. Cron globale: solo domini attivi, oldest first
  const { data: activeDomains, error: domErr } = await ctx.supabase
    .from("network_domains")
    .select("id")
    .in("status", ACTIVE_DOMAIN_STATUSES as unknown as string[]);
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
    .select(AGENCY_SELECT)
    .in("domain_id", activeIds)
    .or(`last_enriched_at.is.null,last_enriched_at.lt.${cutoff.toISOString()}`)
    .neq("publish_status", "trash")
    .order("last_enriched_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE)
    .returns<AgencyRow[]>();
  if (error) {
    ctx.log("select_error", { error: error.message, mode: "global" });
    return null;
  }
  return data ?? [];
}

export async function runAgencyUpdater(ctx: AgentContext): Promise<AgentResult> {
  ctx.log("start", {
    batchSize: BATCH_SIZE,
    refreshDays: REFRESH_DAYS,
    filters: ctx.filters,
  });

  const agencies = await pickAgencies(ctx);
  if (agencies === null) {
    return { status: "error", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }
  if (agencies.length === 0) {
    ctx.log("no_agencies_to_enrich");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  ctx.log("batch_selected", { count: agencies.length });

  let success = 0;
  let errorCount = 0;
  let placesHits = 0;
  let placesMisses = 0;
  let scrapeHits = 0;
  let firecrawlHits = 0;
  let llmHits = 0;

  for (const agency of agencies) {
    const itemStart = Date.now();
    let placesData: PlacesResult | null = null;
    let placesStatus: number | "error" = 0;
    let scrapeData: ScrapeResult | null = null;
    let scrapeStatus: number | "error" | "skip" = "skip";
    let llmData: LlmExtraction | null = null;
    let llmStatus: number | "error" | "skip" = "skip";
    const itemErrors: Record<string, string> = {};

    // ---- Google Places ----
    try {
      placesData = await findPlace(agency.title, agency.citta);
      placesStatus = placesData ? 200 : 404;
      if (placesData) placesHits++;
      else placesMisses++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      itemErrors.google_places = msg;
      placesStatus = "error";
      ctx.log("places_error", { agencyId: agency.id, wpId: agency.wp_id, error: msg });
    }

    // ---- Website scrape (usa sito_web esistente o quello scoperto da Places) ----
    const targetSite = agency.sito_web ?? placesData?.website ?? agency.google_sito ?? null;
    if (targetSite) {
      try {
        scrapeData = await scrapeWebsite(targetSite);
        scrapeStatus = 200;
        scrapeHits++;
        if (scrapeData.source === "firecrawl") firecrawlHits++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        itemErrors.website_scrape = msg;
        scrapeStatus = "error";
        ctx.log("scrape_error", { agencyId: agency.id, url: targetSite, error: msg });
      }
    } else {
      ctx.log("scrape_skip_no_url", { agencyId: agency.id });
    }

    // ---- LLM extraction (OpenAI) ----
    if (scrapeData) {
      try {
        llmData = await extractFromWebsite(scrapeData, agency.title);
        llmStatus = llmData ? 200 : 404;
        if (llmData) llmHits++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        itemErrors.llm = msg;
        llmStatus = "error";
        ctx.log("llm_error", { agencyId: agency.id, error: msg });
      }
    }

    // ---- Build update payload ----
    const updateFields: Record<string, unknown> = {
      last_enriched_at: new Date().toISOString(),
      sources_used: {
        google_places: placesStatus === 200,
        website_scrape: scrapeStatus === 200,
        llm: llmStatus === 200,
      },
    };
    const updated: string[] = ["last_enriched_at", "sources_used"];

    if (placesData) {
      const map: Array<[keyof PlacesResult, string]> = [
        ["place_id", "google_place_id"],
        ["address", "google_indirizzo"],
        ["phone", "google_telefono"],
        ["website", "google_sito"],
        ["category", "google_categoria"],
        ["rating", "google_rating"],
        ["reviews_count", "google_recensioni_count"],
        ["photo_name", "google_foto_url"],
      ];
      for (const [src, dbCol] of map) {
        const v = placesData[src];
        if (v !== null && v !== undefined && v !== "") {
          updateFields[dbCol] = v;
          updated.push(dbCol);
        }
      }
      updateFields.match_confidence = placesData.match_confidence;
      updated.push("match_confidence");
    }

    // L'LLM riempie i campi vuoti (rispetta curatela manuale) …
    if (llmData) {
      for (const field of LLM_FILL_IF_EMPTY) {
        const currentValue = agency[field as LlmFillField];
        const newValue = llmData[field];
        if (isEmpty(currentValue) && !isEmpty(newValue)) {
          updateFields[field] = newValue;
          updated.push(field);
        }
      }
      // … ma sovrascrive sempre descrizione_breve e content quando l'LLM
      // produce contenuti (obiettivo: descrizioni di qualità uniforme).
      for (const field of LLM_ALWAYS_OVERWRITE) {
        const newValue = llmData[field];
        if (!isEmpty(newValue)) {
          updateFields[field] = newValue;
          updated.push(field);
        }
      }
    }

    // Geo resolver: parsa google_indirizzo (o LLM indirizzo_completo come
    // fallback) → override città/regione/aree in formato "Regione>Città".
    // SEMPRE sovrascritto (le aree WP erano sbagliate).
    const geoSource = placesData?.address ?? llmData?.indirizzo_completo ?? null;
    if (geoSource) {
      const geo = resolveItalianAddress(geoSource);
      if (geo) {
        updateFields.aree = geo.aree;
        updateFields.citta = geo.citta_slug;
        updateFields.regioni = geo.regioni_slug;
        updated.push("aree", "citta", "regioni");
      }
    }

    // Overall enrichment_status
    const anySuccess = placesStatus === 200 || llmStatus === 200;
    const anyError = placesStatus === "error" || scrapeStatus === "error" || llmStatus === "error";
    updateFields.enrichment_status = anySuccess
      ? anyError
        ? "partial"
        : "success"
      : anyError
        ? "error"
        : "partial";

    if (Object.keys(itemErrors).length > 0) {
      updateFields.enrichment_errors = itemErrors;
    } else {
      updateFields.enrichment_errors = null;
    }

    // ---- Persist ----
    try {
      const { error: updErr } = await ctx.supabase
        .from("agencies")
        .update(updateFields)
        .eq("id", agency.id);
      if (updErr) throw updErr;

      const itemHadError = anyError && !anySuccess;
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: itemHadError ? "error" : anyError ? "partial" : "success",
        sources_hit: {
          google_places: placesStatus,
          website_scrape: scrapeStatus,
          llm: llmStatus,
        },
        fields_updated: updated,
        errors: Object.keys(itemErrors).length > 0 ? itemErrors : null,
        duration_ms: Date.now() - itemStart,
      });

      if (itemHadError) errorCount++;
      else success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      ctx.log("update_error", { agencyId: agency.id, error: msg });
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: "error",
        errors: { message: msg },
        duration_ms: Date.now() - itemStart,
      });
      errorCount++;
    }
  }

  ctx.log("batch_complete", {
    success,
    errorCount,
    placesHits,
    placesMisses,
    scrapeHits,
    firecrawlHits,
    llmHits,
  });

  return {
    status: errorCount === 0 ? "success" : success > 0 ? "partial" : "error",
    rowsProcessed: agencies.length,
    rowsSuccess: success,
    rowsError: errorCount,
    meta: {
      placesHits,
      placesMisses,
      scrapeHits,
      firecrawlHits,
      llmHits,
      batchSize: BATCH_SIZE,
    },
  };
}
