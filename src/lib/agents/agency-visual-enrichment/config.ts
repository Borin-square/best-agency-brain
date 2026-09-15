import type { Agent } from "../framework";
import { runAgencyVisualEnrichment } from "./run";

export const agencyVisualEnrichment: Agent = {
  id: "agency-visual-enrichment",
  name: "Agency Visual Enrichment",
  description:
    "Trova logo, foto team e portfolio dai siti ufficiali, verifica qualità/pertinenza, carica su Supabase Storage e aggiorna solo campi visivi. Lavora su agenzie esistenti (non crea nuove).",
  schedule: "15 * * * *",
  enabled: true,
  run: runAgencyVisualEnrichment,
};
