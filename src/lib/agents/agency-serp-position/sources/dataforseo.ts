// DataForSEO SERP API — Google Organic Live (Regular).
// Docs: https://docs.dataforseo.com/v3/serp/google/organic/live/regular/
//
// Ritorna la SERP organica top-100 con rank_absolute, url, title, domain.
// Sul tier free/trial DataForSEO limita a 1 task per POST body ("You can
// set only one task at a time"), quindi facciamo N POST paralleli con
// concorrenza limitata a CONCURRENCY.
//
// Auth: Basic (base64(login:password)). Env: DATAFORSEO_LOGIN + _PASSWORD.

const API_URL =
  "https://api.dataforseo.com/v3/serp/google/organic/live/regular";
const LOCATION_CODE_ITALY = 2380;
const LANGUAGE_CODE_IT = "it";
const TARGET_DOMAIN = "miglioreagenzia.it";
const DEFAULT_DEPTH = 100; // top-100 SERP
const CONCURRENCY = 10; // request paralleli max verso DataForSEO

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
 * Esegue N ricerche SERP e ritorna la posizione di TARGET_DOMAIN per ogni
 * keyword. Un POST per task (limitazione tier free DataForSEO), N POST
 * paralleli con concorrenza CONCURRENCY.
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

  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const results: SerpTaskResult[] = [];

  // Chunking per limitare concorrenza (evita rate-limit + rispetta tier).
  for (let i = 0; i < inputs.length; i += CONCURRENCY) {
    const chunk = inputs.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((input) => fetchSingleTask(input, auth)),
    );
    for (const [idx, s] of settled.entries()) {
      if (s.status === "fulfilled") {
        results.push(s.value);
      } else {
        results.push({
          refId: chunk[idx].refId,
          keyword: chunk[idx].keyword,
          position: null,
          url: null,
          error: s.reason instanceof Error ? s.reason.message : String(s.reason),
        });
      }
    }
  }

  return results;
}

async function fetchSingleTask(
  input: SerpTaskInput,
  auth: string,
): Promise<SerpTaskResult> {
  const body = [
    {
      keyword: input.keyword,
      language_code: LANGUAGE_CODE_IT,
      location_code: LOCATION_CODE_ITALY,
      depth: DEFAULT_DEPTH,
      tag: input.refId,
    },
  ];

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
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as DfsResponse;
  if (json.status_code >= 40000) {
    throw new Error(`API error ${json.status_code}: ${json.status_message}`);
  }

  const task = json.tasks?.[0];
  if (!task) {
    return {
      refId: input.refId,
      keyword: input.keyword,
      position: null,
      url: null,
      error: "no_task_returned",
    };
  }

  if (task.status_code >= 40000) {
    return {
      refId: input.refId,
      keyword: input.keyword,
      position: null,
      url: null,
      error: task.status_message,
    };
  }

  const items = task.result?.[0]?.items ?? [];
  const match = findTargetPosition(items);
  return {
    refId: input.refId,
    keyword: input.keyword,
    position: match?.position ?? null,
    url: match?.url ?? null,
  };
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
