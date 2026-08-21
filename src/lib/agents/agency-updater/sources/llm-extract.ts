// Passa il testo scrappato a un LLM (OpenAI) per estrarre campi strutturati
// dell'agenzia. Usa Structured Outputs (json_schema strict) → zero parsing bugs.
//
// Se in futuro serve cambiare provider, sostituire solo questo file mantenendo
// la stessa firma extractFromWebsite().

import OpenAI from "openai";
import type { ScrapedSite } from "./website-scrape";

export interface LlmExtraction {
  descrizione_breve: string | null;
  content: string | null;
  competenze: string[] | null;
  caratteristiche: string[] | null;
  anno_di_fondazione: number | null;
  dimensione_team: string | null;
  partita_iva: string | null;
  lingue: string[] | null;
  fascia_di_prezzo: string | null;
  email: string | null;
  telefono: string | null;
  linkedin: string | null;
  instagram: string | null;
  behance: string | null;
  indirizzo_completo: string | null;
  confidence: "high" | "medium" | "low";
}

const MODEL = "gpt-4o-mini";

// Structured Outputs richiede tutti i campi in `required` e additionalProperties: false.
// Null-ability si dichiara con type: ["string", "null"].
const EXTRACTION_SCHEMA = {
  name: "agency_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      descrizione_breve: {
        type: ["string", "null"],
        description: "Payoff / tagline, max 200 caratteri.",
      },
      content: {
        type: ["string", "null"],
        description: "Descrizione lunga in italiano (2-4 frasi) su cosa fa l'agenzia.",
      },
      competenze: {
        type: ["array", "null"],
        items: { type: "string" },
        description: "Servizi/aree competenza in lowercase (es. 'seo', 'meta ads').",
      },
      caratteristiche: {
        type: ["array", "null"],
        items: { type: "string" },
        description: "Caratteristiche distintive (es. 'remote-first', 'b-corp').",
      },
      anno_di_fondazione: {
        type: ["integer", "null"],
        description: "Anno (YYYY), solo se esplicitamente indicato nel testo.",
      },
      dimensione_team: {
        type: ["string", "null"],
        description: "Range: '1-5', '5-10', '10-25', '25-50', '50+'.",
      },
      partita_iva: {
        type: ["string", "null"],
        description: "P.IVA italiana (11 cifre), solo se presente. Ignora CF/REA.",
      },
      lingue: {
        type: ["array", "null"],
        items: { type: "string" },
        description: "Lingue di lavoro (es. ['italiano', 'inglese']).",
      },
      fascia_di_prezzo: {
        type: ["string", "null"],
        description: "'€', '€€', '€€€'.",
      },
      email: { type: ["string", "null"] },
      telefono: { type: ["string", "null"] },
      linkedin: {
        type: ["string", "null"],
        description: "URL completo LinkedIn aziendale.",
      },
      instagram: { type: ["string", "null"] },
      behance: { type: ["string", "null"] },
      indirizzo_completo: {
        type: ["string", "null"],
        description: "Sede completa se indicata nel sito.",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
      },
    },
    required: [
      "descrizione_breve",
      "content",
      "competenze",
      "caratteristiche",
      "anno_di_fondazione",
      "dimensione_team",
      "partita_iva",
      "lingue",
      "fascia_di_prezzo",
      "email",
      "telefono",
      "linkedin",
      "instagram",
      "behance",
      "indirizzo_completo",
      "confidence",
    ],
  },
} as const;

function buildPrompt(scraped: ScrapedSite, agencyName: string): string {
  return `Analizza il testo del sito ufficiale di questa agenzia italiana ed estrai i campi richiesti.

REGOLE FERREE:
- Ritorna null per qualsiasi campo NON chiaramente evidente. Non inventare mai.
- anno_di_fondazione: accetta solo se citato ("fondata nel 2015", "since 2010", "dal 2020").
- partita_iva: solo 11 cifre italiane. Ignora codici fiscali (16 char) e numeri REA.
- URL social: URL completo (https://linkedin.com/company/...).
- descrizione_breve max 200 char; content 2-4 frasi.
- competenze/caratteristiche: max 12 elementi, lowercase, no duplicati.

Agenzia: ${agencyName}
URL: ${scraped.final_url}
Meta title: ${scraped.meta_title ?? "(none)"}
Meta description: ${scraped.meta_description ?? "(none)"}

--- TESTO SITO ---
${scraped.text}
--- FINE TESTO ---`;
}

export async function extractFromWebsite(
  scraped: ScrapedSite,
  agencyName: string,
): Promise<LlmExtraction | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Sei un data extractor rigoroso. Rispondi solo con dati verificabili dal testo. Null è meglio di un'invenzione.",
      },
      { role: "user", content: buildPrompt(scraped, agencyName) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: EXTRACTION_SCHEMA,
    },
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  let parsed: Partial<LlmExtraction>;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  return {
    descrizione_breve: parsed.descrizione_breve ?? null,
    content: parsed.content ?? null,
    competenze: Array.isArray(parsed.competenze) && parsed.competenze.length > 0 ? parsed.competenze : null,
    caratteristiche:
      Array.isArray(parsed.caratteristiche) && parsed.caratteristiche.length > 0
        ? parsed.caratteristiche
        : null,
    anno_di_fondazione:
      typeof parsed.anno_di_fondazione === "number" ? parsed.anno_di_fondazione : null,
    dimensione_team: parsed.dimensione_team ?? null,
    partita_iva: parsed.partita_iva ?? null,
    lingue: Array.isArray(parsed.lingue) && parsed.lingue.length > 0 ? parsed.lingue : null,
    fascia_di_prezzo: parsed.fascia_di_prezzo ?? null,
    email: parsed.email ?? null,
    telefono: parsed.telefono ?? null,
    linkedin: parsed.linkedin ?? null,
    instagram: parsed.instagram ?? null,
    behance: parsed.behance ?? null,
    indirizzo_completo: parsed.indirizzo_completo ?? null,
    confidence: parsed.confidence ?? "low",
  };
}
