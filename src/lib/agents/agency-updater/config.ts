import type { Agent } from "../framework";
import { runAgencyUpdater } from "./run";

export const agencyUpdater: Agent = {
  id: "agency-updater",
  name: "Agency Updater",
  description:
    "Arricchisce i dati delle agenzie (sito, Google Places, VIES, normalizzazione via Claude). Cron giornaliero.",
  schedule: "0 3 * * *",
  enabled: true,
  run: runAgencyUpdater,
};
