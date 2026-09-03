// Passa il testo scrappato a un LLM (OpenAI) per estrarre campi strutturati
// dell'agenzia. Usa Structured Outputs (json_schema strict) → zero parsing bugs.
//
// Se in futuro serve cambiare provider, sostituire solo questo file mantenendo
// la stessa firma extractFromWebsite().

import OpenAI from "openai";
import type { ScrapedSite } from "./website-scrape";
import type { AgencySkill } from "@/lib/agency-skills";

export interface LlmExtraction {
  descrizione_breve: string | null;
  content: string | null;
  competenze_core: string[] | null;
  competenze_principali: string[] | null;
  altre_competenze: string[] | null;
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
        description:
          "Payoff SEO-friendly, 140-180 caratteri, orientato al cliente (chi sono, cosa fanno, per chi). No claim vaghi tipo 'siamo i migliori'.",
      },
      content: {
        type: ["string", "null"],
        description:
          "Descrizione lunga in italiano ben strutturata (600-1200 caratteri, 3-5 paragrafi separati da doppio a-capo). Struttura: (1) chi sono e cosa fanno in 1 frase, (2) servizi/aree di competenza principali, (3) target clienti tipico + settori, (4) elemento distintivo/approccio. Tono professionale, no marketing gonfiato. Basato solo su ciò che è verificabile dal testo — se un blocco non è ricavabile, saltalo.",
      },
      competenze_core: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 2 competenze CORE: il/i servizio/i attorno cui gira l'intera agenzia (identità principale). Usa solo label dalla lista permessa fornita nel prompt.",
      },
      competenze_principali: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 5 competenze PRINCIPALI: servizi che l'agenzia offre attivamente e su cui è forte (oltre le core). Usa solo label dalla lista permessa.",
      },
      altre_competenze: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 10 competenze ALTRE: servizi complementari o secondari citati nel sito. Usa solo label dalla lista permessa.",
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
      "competenze_core",
      "competenze_principali",
      "altre_competenze",
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

function buildPrompt(
  scraped: ScrapedSite,
  agencyName: string,
  allowedSkills: AgencySkill[],
): string {
  const allowList = allowedSkills.length
    ? allowedSkills.map((s) => `- ${s.label} (slug: ${s.slug})`).join("\n")
    : "(nessuna competenza configurata per questo dominio)";

  return `Analizza il testo del sito ufficiale di questa agenzia ed estrai i campi richiesti.

REGOLE FERREE per i dati fattuali:
- Ritorna null per qualsiasi campo NON chiaramente evidente. Non inventare mai.
- anno_di_fondazione: accetta solo se citato ("fondata nel 2015", "since 2010", "dal 2020").
- partita_iva: solo 11 cifre italiane. Ignora codici fiscali (16 char) e numeri REA.
- URL social: URL completo (https://linkedin.com/company/...).
- caratteristiche: max 12 elementi, lowercase, no duplicati.

REGOLE per le competenze (tre gruppi obbligatoriamente disgiunti):
- USA ESCLUSIVAMENTE label prese da questa LISTA PERMESSA. Se un servizio dell'agenzia non è nella lista, IGNORALO (non inventare voci nuove).
- competenze_core: max 2 — il servizio attorno al quale gira TUTTA l'attività dell'agenzia (identità principale, ciò che viene per primo nell'headline / meta title / homepage hero). Se non è chiaramente identificabile, ritorna null o [].
- competenze_principali: max 5 — servizi offerti attivamente, con pagina o sezione dedicata sul sito. NON includere qui le voci già in competenze_core.
- altre_competenze: max 10 — servizi complementari o citati marginalmente. NON includere qui voci già in core o principali.
- Nessun duplicato tra i tre gruppi. Usa la label ESATTA della lista (rispetta maiuscole/minuscole).

LISTA PERMESSA (usa solo queste, non inventare):
${allowList}

REGOLE per le descrizioni (descrizione_breve + content):
- Scrivi in italiano professionale e diretto, per un cliente che deve capire in 10 secondi se contattare l'agenzia.
- descrizione_breve: 140-180 char. Formula tipo "[Cosa fa] per [chi/dove]. [Elemento distintivo se noto]."
- content: 600-1200 char, 3-5 paragrafi separati da doppio a-capo (\\n\\n). Segui la struttura in schema. NO frasi vuote come "leader nel settore", "eccellenza a 360°", "soluzioni innovative". Ogni frase deve dire un fatto specifico.
- Se il sito è povero di info non gonfiare: piuttosto content più corto ma vero.

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
  allowedSkills: AgencySkill[],
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
          "Sei un data extractor rigoroso. Rispondi solo con dati verificabili dal testo. Null è meglio di un'invenzione. Per le competenze usa esclusivamente label dalla lista permessa nel prompt.",
      },
      { role: "user", content: buildPrompt(scraped, agencyName, allowedSkills) },
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

  const arr = (v: unknown): string[] | null =>
    Array.isArray(v) && v.length > 0 ? (v as string[]) : null;

  return {
    descrizione_breve: parsed.descrizione_breve ?? null,
    content: parsed.content ?? null,
    competenze_core: arr(parsed.competenze_core),
    competenze_principali: arr(parsed.competenze_principali),
    altre_competenze: arr(parsed.altre_competenze),
    caratteristiche: arr(parsed.caratteristiche),
    anno_di_fondazione:
      typeof parsed.anno_di_fondazione === "number" ? parsed.anno_di_fondazione : null,
    dimensione_team: parsed.dimensione_team ?? null,
    partita_iva: parsed.partita_iva ?? null,
    lingue: arr(parsed.lingue),
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
