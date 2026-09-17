import type { Agent } from "../framework";
import { runMatriceSerpPosition } from "./run";

export const matriceSerpPosition: Agent = {
  id: "matrice-serp-position",
  name: "Matrice SERP Position",
  description:
    "Scansiona posizione miglioreagenzia.it in SERP per ogni cella (area × competenza) con ≥5 agenzie. Query: '{modificatore} {label_skill} {label_area}'. Weekly.",
  schedule: "0 6 * * 1",
  enabled: true,
  run: runMatriceSerpPosition,
};
