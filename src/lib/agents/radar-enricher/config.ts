import type { Agent } from "../framework";
import { runRadarEnricher } from "./run";

export const radarEnricher: Agent = {
  id: "radar-enricher",
  name: "Radar Enricher",
  description:
    "Arricchisce le sessioni radar non ancora processate: IP → azienda (AbstractAPI + reverse DNS) + match fuzzy sulle agenzie in DB. Batch 50 ogni 15 min.",
  schedule: "*/15 * * * *",
  enabled: true,
  run: runRadarEnricher,
};
