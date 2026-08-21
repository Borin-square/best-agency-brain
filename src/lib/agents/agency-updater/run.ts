import type { AgentContext, AgentResult } from "../framework";
import { findPlace, type PlacesResult } from "./sources/google-places";

const BATCH_SIZE = 30;
const REFRESH_DAYS = 30;

interface AgencyRow {
  id: string;
  wp_id: number | null;
  title: string;
  citta: string | null;
  sito_web: string | null;
  partita_iva: string | null;
  google_place_id: string | null;
  last_enriched_at: string | null;
}

export async function runAgencyUpdater(ctx: AgentContext): Promise<AgentResult> {
  ctx.log("start", { batchSize: BATCH_SIZE, refreshDays: REFRESH_DAYS });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REFRESH_DAYS);

  const { data: agencies, error } = await ctx.supabase
    .from("agencies")
    .select("id, wp_id, title, citta, sito_web, partita_iva, google_place_id, last_enriched_at")
    .or(`last_enriched_at.is.null,last_enriched_at.lt.${cutoff.toISOString()}`)
    .neq("publish_status", "trash")
    .order("last_enriched_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE)
    .returns<AgencyRow[]>();

  if (error) {
    ctx.log("select_error", { error: error.message });
    return { status: "error", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }
  if (!agencies || agencies.length === 0) {
    ctx.log("no_agencies_to_enrich");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  ctx.log("batch_selected", { count: agencies.length });

  let success = 0;
  let errorCount = 0;
  let placesHits = 0;
  let placesMisses = 0;

  for (const agency of agencies) {
    const itemStart = Date.now();
    let placesData: PlacesResult | null = null;
    let placesStatus: number | "error" = 0;
    let itemError: string | null = null;

    // ---- Google Places ----
    try {
      placesData = await findPlace(agency.title, agency.citta);
      placesStatus = placesData ? 200 : 404;
      if (placesData) placesHits++;
      else placesMisses++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      itemError = `google_places: ${msg}`;
      placesStatus = "error";
      ctx.log("places_error", { agencyId: agency.id, wpId: agency.wp_id, error: msg });
    }

    // ---- Build update payload ----
    const updateFields: Record<string, unknown> = {
      last_enriched_at: new Date().toISOString(),
      sources_used: { google_places: placesStatus === 200 },
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
      updateFields.enrichment_status = "success";
    } else {
      updateFields.enrichment_status = placesStatus === "error" ? "error" : "partial";
    }

    if (itemError) {
      updateFields.enrichment_errors = { message: itemError };
    }

    // ---- Persist ----
    try {
      const { error: updErr } = await ctx.supabase
        .from("agencies")
        .update(updateFields)
        .eq("id", agency.id);
      if (updErr) throw updErr;

      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: placesStatus === "error" ? "error" : "success",
        sources_hit: { google_places: placesStatus },
        fields_updated: updated,
        errors: itemError ? { message: itemError } : null,
        duration_ms: Date.now() - itemStart,
      });

      if (placesStatus === "error") errorCount++;
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

  ctx.log("batch_complete", { success, errorCount, placesHits, placesMisses });

  return {
    status: errorCount === 0 ? "success" : success > 0 ? "partial" : "error",
    rowsProcessed: agencies.length,
    rowsSuccess: success,
    rowsError: errorCount,
    meta: { placesHits, placesMisses, batchSize: BATCH_SIZE },
  };
}
