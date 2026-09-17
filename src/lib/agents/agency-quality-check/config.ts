import type { Agent } from "../framework";
import { runAgencyQualityCheck } from "./run";

export const agencyQualityCheck: Agent = {
  id: "agency-quality-check",
  name: "Agency Quality Check",
  description:
    "Rileva agenzie duplicate, blacklist domains, siti morti, dati vuoti/test. Auto-trash sui blacklist domains, auto-merge sui duplicati hard (place_id/domain/vat), review per il resto. Cron giornaliero.",
  schedule: "0 4 * * *",
  enabled: true,
  run: runAgencyQualityCheck,
};
