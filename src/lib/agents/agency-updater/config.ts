import type { Agent } from "../framework";
import { runAgencyUpdater } from "./run";

export const agencyUpdater: Agent = {
  id: "agency-updater",
  name: "Agency Updater",
  description:
    "Arricchisce i dati delle agenzie (sito scrape + LLM extract, Google Places, VIES). Popola i campi del data dictionary. Cron ogni 30 minuti.",
  schedule: "*/30 * * * *",
  enabled: true,
  run: runAgencyUpdater,
};
