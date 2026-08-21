// Dato il testo scrappato di una pagina "elenco" (directory/premio/rivista),
// chiede all'LLM di estrarre i nomi + link candidati.

import OpenAI from "openai";
import type { ScrapeResult } from "../../agency-updater/sources/website-scrape";

export interface DiscoveredCandidate {
  name: string;
  url_hint: string | null; // link diretto se trovato nella fonte
}

const SCHEMA = {
  name: "list_candidates",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string", description: "Nome pubblico dell'agenzia" },
            url_hint: {
              type: ["string", "null"],
              description:
                "URL diretto al sito dell'agenzia SE presente esplicito nella pagina (non l'URL della directory stessa). null se non chiaro.",
            },
          },
          required: ["name", "url_hint"],
        },
      },
    },
    required: ["candidates"],
  },
} as const;

const MODEL = "gpt-4o-mini";

export async function discoverCandidatesFromPage(
  page: ScrapeResult,
  sourceContext: string,
): Promise<DiscoveredCandidate[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];
  const client = new OpenAI({ apiKey });

  const prompt = `Sto raccogliendo candidati agenzie di comunicazione/marketing/digital da una pagina di ${sourceContext}.

Estrai TUTTI i nomi di agenzie citati esplicitamente nella pagina (voci di elenco, vincitori, shortlist, casi studio). Non inserire:
- freelance singoli
- software house pure (senza servizi marketing)
- SaaS/prodotti
- media/riviste
- associazioni/enti
- la fonte stessa

Se il testo mostra un link accanto al nome (dominio proprietario, NON il profilo interno alla directory), copialo in url_hint. Altrimenti null.

Pagina fonte: ${page.final_url}
Meta title: ${page.meta_title ?? "(none)"}

--- TESTO PAGINA ---
${page.text}
--- FINE ---

Chiama list_candidates con i risultati. Max 40 candidati per pagina.`;

  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Sei un estrattore di elenchi di agenzie. Ritorna solo agenzie chiaramente citate, non inventare.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: SCHEMA },
    });
    const content = res.choices[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content) as { candidates: DiscoveredCandidate[] };
    return (parsed.candidates ?? []).slice(0, 40);
  } catch {
    return [];
  }
}
