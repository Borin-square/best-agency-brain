import type { Agent } from "../framework";
import { runAgencyScouter } from "./run";

export const agencyScouter: Agent = {
  id: "agency-scouter",
  name: "Agency Scouter",
  description:
    "Trova nuove agenzie di comunicazione/marketing/digital partendo da directory, premi, riviste e SERP. Verifica sito ufficiale, dedup, inserisce come 'draft/proposta'. L'enrichment è a carico di agency-updater.",
  schedule: "",
  enabled: false, // solo trigger manuale con payload
  run: runAgencyScouter,
};
