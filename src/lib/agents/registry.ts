import type { Agent } from "./framework";
import { agencyUpdater } from "./agency-updater/config";

export const AGENTS: Record<string, Agent> = {
  [agencyUpdater.id]: agencyUpdater,
};

export function getAgent(id: string): Agent | null {
  return AGENTS[id] ?? null;
}

export function listAgents(): Agent[] {
  return Object.values(AGENTS);
}
