import type { Agent } from "../framework";
import { runAgencyVisualEnrichment } from "./run";

export const agencyVisualEnrichment: Agent = {
  id: "agency-visual-enrichment",
  name: "Agency Visual Enrichment",
  description:
    "Trova logo e foto team dai siti ufficiali, verifica qualità/pertinenza, carica su Supabase Storage e aggiorna solo campi visivi. Lavora su agenzie esistenti (non crea nuove).",
  schedule: "",
  enabled: true, // manuale (via selezione agenzie in tab Agenzie o filtro dominio)
  run: runAgencyVisualEnrichment,
};
