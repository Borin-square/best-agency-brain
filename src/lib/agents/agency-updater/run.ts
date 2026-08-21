import type { AgentContext, AgentResult } from "../framework";

const BATCH_SIZE = 20;
const REFRESH_DAYS = 30;

// Placeholder: seleziona batch di agenzie da arricchire e aggiorna last_enriched_at.
// Le integrazioni reali (Firecrawl / Google Places / VIES / Claude) sono in sources/*.ts
// e vanno cablate qui una volta pronte le API key.
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
    .limit(BATCH_SIZE);

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

  for (const agency of agencies) {
    try {
      // TODO: chiamare sources/firecrawl.ts (sito_web), sources/google-places.ts (title + citta),
      // sources/vies.ts (partita_iva), sources/claude-normalize.ts per merge finale.
      // Per ora placeholder: aggiorna solo last_enriched_at.
      const { error: updateErr } = await ctx.supabase
        .from("agencies")
        .update({
          last_enriched_at: new Date().toISOString(),
          enrichment_status: "success",
          sources_used: {
            firecrawl: false,
            google_places: false,
            vies: false,
            claude: false,
            note: "placeholder — sources not implemented yet",
          },
        })
        .eq("id", agency.id);

      if (updateErr) throw updateErr;

      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: "success",
        fields_updated: ["last_enriched_at", "enrichment_status", "sources_used"],
      });
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      ctx.log("agency_error", { agencyId: agency.id, wpId: agency.wp_id, error: msg });
      await ctx.supabase.from("agent_run_items").insert({
        run_id: ctx.runId,
        agency_id: agency.id,
        status: "error",
        errors: { message: msg },
      });
      errorCount++;
    }
  }

  ctx.log("batch_complete", { success, errorCount });

  return {
    status: errorCount === 0 ? "success" : success > 0 ? "partial" : "error",
    rowsProcessed: agencies.length,
    rowsSuccess: success,
    rowsError: errorCount,
  };
}
