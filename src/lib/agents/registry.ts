import type { Agent } from "./framework";
import { agencyUpdater } from "./agency-updater/config";
import { agencyScouter } from "./agency-scouter/config";
import { agencyVisualEnrichment } from "./agency-visual-enrichment/config";
import { agencyQualityCheck } from "./agency-quality-check/config";
import { agencySerpPosition } from "./agency-serp-position/config";

export const AGENTS: Record<string, Agent> = {
  [agencyUpdater.id]: agencyUpdater,
  [agencyScouter.id]: agencyScouter,
  [agencyVisualEnrichment.id]: agencyVisualEnrichment,
  [agencyQualityCheck.id]: agencyQualityCheck,
  [agencySerpPosition.id]: agencySerpPosition,
};

export function getAgent(id: string): Agent | null {
  return AGENTS[id] ?? null;
}

export function listAgents(): Agent[] {
  return Object.values(AGENTS);
}
