import type { Agent } from "../framework";
import { runAgencySerpPosition } from "./run";

export const agencySerpPosition: Agent = {
  id: "agency-serp-position",
  name: "Agency SERP Position",
  description:
    "Cerca su Google '{nome agenzia} {città}' e salva la posizione di miglioreagenzia.it nella SERP. Storico in agency_serp_snapshots. DataForSEO API.",
  schedule: "0 5 * * 1", // weekly, lunedì 05:00 (indicativo, source of truth è agent_schedules)
  enabled: true,
  run: runAgencySerpPosition,
};
