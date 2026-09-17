// DataForSEO SERP API — Google Organic Live (Regular).
// Docs: https://docs.dataforseo.com/v3/serp/google/organic/live/regular/
//
// Endpoint accetta batch di task (max 100/POST) e ritorna per ognuno la
// SERP organica top-100 con rank_absolute, url, title, domain.
//
// Auth: Basic (base64(login:password)). Env: DATAFORSEO_LOGIN + _PASSWORD.

const API_URL =
  "https://api.dataforseo.com/v3/serp/google/organic/live/regular";
const LOCATION_CODE_ITALY = 2380;
const LANGUAGE_CODE_IT = "it";
const TARGET_DOMAIN = "miglioreagenzia.it";
const DEFAULT_DEPTH = 100; // top-100 SERP

export interface SerpTaskInput {
  keyword: string; // es. "Vanilla Marketing Ancona"
  refId: string; // agency_id (per collegare risposta → agenzia)
}

export interface SerpTaskResult {
  refId: string;
  keyword: string;
  position: number | null; // null = non in top 100
  url: string | null; // URL specifica che ha rankato
  error?: string;
}

interface DfsTaskItem {
  type?: string;
  rank_absolute?: number;
  domain?: string;
  url?: string;
  title?: string;
}

interface DfsTaskResult {
  keyword: string;
  se_domain?: string;
  location_code?: number;
  items?: DfsTaskItem[];
}

interface DfsTask {
  id: string;
  status_code: number;
  status_message: string;
  data?: { keyword?: string };
  result?: DfsTaskResult[] | null;
}

interface DfsResponse {
  status_code: number;
  status_message: string;
  tasks?: DfsTask[];
}

/**
 * Esegue un batch di ricerche SERP e ritorna la posizione di TARGET_DOMAIN
 * per ogni keyword. Un singolo POST per l'intero batch (max 100 task).
 */
export async function fetchSerpBatch(
  inputs: SerpTaskInput[],
): Promise<SerpTaskResult[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD missing");
  }
  if (inputs.length === 0) return [];
  if (inputs.length > 100) {
    throw new Error(`DataForSEO batch max 100 tasks, got ${inputs.length}`);
  }

  const auth = Buffer.from(`${login}:${password}`).toString("base64");

  // Costruisce array di task per il POST. Usiamo l'id di DataForSEO
  // (parametro `tag`) per remappare la risposta al refId (agency_id).
  const body = inputs.map((input) => ({
    keyword: input.keyword,
    language_code: LANGUAGE_CODE_IT,
    location_code: LOCATION_CODE_ITALY,
    depth: DEFAULT_DEPTH,
    tag: input.refId, // custom identifier ritornato nella risposta
  }));

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataForSEO HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as DfsResponse;
  if (json.status_code >= 40000) {
    throw new Error(`DataForSEO error ${json.status_code}: ${json.status_message}`);
  }

  // Mappa risposte per refId (via tag). Attenzione: il tag torna dentro `data.tag`.
  const results: SerpTaskResult[] = [];
  const seenRefIds = new Set<string>();

  for (const task of json.tasks ?? []) {
    // DataForSEO ritorna `data.tag` con il valore che abbiamo passato.
    const refId = (task.data as { tag?: string } | undefined)?.tag ?? "";
    const keyword = task.data?.keyword ?? "";

    if (task.status_code >= 40000) {
      results.push({
        refId,
        keyword,
        position: null,
        url: null,
        error: task.status_message,
      });
      seenRefIds.add(refId);
      continue;
    }

    const items = task.result?.[0]?.items ?? [];
    const match = findTargetPosition(items);
    results.push({
      refId,
      keyword,
      position: match?.position ?? null,
      url: match?.url ?? null,
    });
    seenRefIds.add(refId);
  }

  // Aggiungi missing per gli input che non hanno ricevuto risposta (safety)
  for (const input of inputs) {
    if (!seenRefIds.has(input.refId)) {
      results.push({
        refId: input.refId,
        keyword: input.keyword,
        position: null,
        url: null,
        error: "no_task_returned",
      });
    }
  }

  return results;
}

/**
 * Cerca nel top-100 SERP la prima riga il cui dominio è miglioreagenzia.it
 * (o sottodominio). Ritorna rank_absolute + url oppure null.
 */
function findTargetPosition(
  items: DfsTaskItem[],
): { position: number; url: string } | null {
  for (const item of items) {
    if (item.type !== "organic") continue;
    const dom = (item.domain ?? "").toLowerCase();
    if (dom === TARGET_DOMAIN || dom.endsWith(`.${TARGET_DOMAIN}`)) {
      const position = item.rank_absolute ?? null;
      const url = item.url ?? null;
      if (position != null) {
        return { position, url: url ?? "" };
      }
    }
  }
  return null;
}
