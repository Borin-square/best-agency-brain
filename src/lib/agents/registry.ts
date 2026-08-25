import type { Agent } from "./framework";
import { agencyUpdater } from "./agency-updater/config";
import { agencyScouter } from "./agency-scouter/config";
import { agencyVisualEnrichment } from "./agency-visual-enrichment/config";

export const AGENTS: Record<string, Agent> = {
  [agencyUpdater.id]: agencyUpdater,
  [agencyScouter.id]: agencyScouter,
  [agencyVisualEnrichment.id]: agencyVisualEnrichment,
};

export function getAgent(id: string): Agent | null {
  return AGENTS[id] ?? null;
}

export function listAgents(): Agent[] {
  return Object.values(AGENTS);
}
