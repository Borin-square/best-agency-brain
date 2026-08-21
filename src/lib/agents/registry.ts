import type { Agent } from "./framework";
import { agencyUpdater } from "./agency-updater/config";
import { agencyScouter } from "./agency-scouter/config";

export const AGENTS: Record<string, Agent> = {
  [agencyUpdater.id]: agencyUpdater,
  [agencyScouter.id]: agencyScouter,
};

export function getAgent(id: string): Agent | null {
  return AGENTS[id] ?? null;
}

export function listAgents(): Agent[] {
  return Object.values(AGENTS);
}
