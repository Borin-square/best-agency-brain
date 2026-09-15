// Passa il testo scrappato a un LLM (OpenAI) per estrarre campi strutturati
// dell'agenzia. Usa Structured Outputs (json_schema strict) → zero parsing bugs.
//
// Se in futuro serve cambiare provider, sostituire solo questo file mantenendo
// la stessa firma extractFromWebsite().

import OpenAI from "openai";
import type { ScrapedSite } from "./website-scrape";
import type { AgencySkill } from "@/lib/agency-skills";

export interface FounderLeaderItem {
  name: string;
  role: string | null;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LlmExtraction {
  // Contenuti editoriali
  descrizione_breve: string | null;
  content: string | null;

  // Competenze (tassonomia controllata)
  competenze_core: string[] | null;
  competenze_principali: string[] | null;
  altre_competenze: string[] | null;
  caratteristiche: string[] | null;

  // Contatti & identità legacy
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

  // === Dictionary fields (0012) ===
  // Identità estesa
  alternate_names: string[] | null;
  founder_leader: FounderLeaderItem[] | null;

  // Servizi & fit clienti
  deliverables: string[] | null;
  platforms_tech: string[] | null;
  industries: string[] | null;
  audiences: string[] | null;
  ideal_client_sizes: string[] | null;
  engagement_models: string[] | null;

  // Pricing strutturato
  min_project_budget: number | null;
  min_project_currency: string | null;
  typical_project_min: number | null;
  typical_project_max: number | null;
  pricing_models: string[] | null;

  // Contenuti strutturati
  differentiators: string[] | null;
  declared_methodology: string | null;
  faq: FaqItem[] | null;

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
      // ---- Contenuti editoriali ----
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

      // ---- Competenze ----
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

      // ---- Identità & contatti legacy ----
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

      // ---- Dictionary: identità estesa ----
      alternate_names: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 3 varianti del nome (acronimi, sigle, brand alternativi ricorrenti nel sito). Ignora traduzioni.",
      },
      founder_leader: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            role: { type: ["string", "null"] },
          },
          required: ["name", "role"],
        },
        description:
          "Max 5 founder/leader esplicitamente presentati come figure chiave nel sito (team/about page). Solo persone reali con nome e cognome citati. Non inventare.",
      },

      // ---- Dictionary: servizi & fit clienti ----
      deliverables: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 10 output/prodotti concreti dichiarati (es. 'sito-web', 'ecommerce', 'brand-identity', 'campagne-social', 'video-corporate', 'app-mobile', 'crm-setup'). Slug kebab-case in italiano.",
      },
      platforms_tech: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 12 piattaforme/tecnologie esplicitamente dichiarate o dimostrate (es. 'wordpress', 'shopify', 'hubspot', 'meta-ads', 'google-ads', 'ga4', 'salesforce', 'klaviyo'). Slug kebab-case.",
      },
      industries: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 8 settori clienti serviti con esperienza dimostrata (es. 'moda', 'food-beverage', 'salute', 'finanza', 'automotive', 'immobiliare', 'travel', 'b2b-industriale'). Slug kebab-case. Solo se supportati da case, cliente citato, o dichiarazione esplicita.",
      },
      audiences: {
        type: ["array", "null"],
        items: { type: "string", enum: ["b2b", "b2c", "b2g", "nonprofit"] },
        description:
          "Mercato/i di riferimento dichiarati dall'agenzia. Enum stretto: b2b, b2c, b2g, nonprofit. Se non chiaro dal sito, ritorna null.",
      },
      ideal_client_sizes: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["startup", "smb", "mid-market", "enterprise"],
        },
        description:
          "Dimensione del cliente per cui l'agenzia è particolarmente adatta. Enum: startup, smb, mid-market, enterprise. Solo se dichiarato o evidente dai case.",
      },
      engagement_models: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["project", "retainer", "consulting", "performance", "outsourcing"],
        },
        description:
          "Modelli di ingaggio offerti. Enum stretto. Deducibili da 'progetto', 'retainer mensile', 'consulenza', 'performance-based', 'staff augmentation/outsourcing'.",
      },

      // ---- Dictionary: pricing strutturato ----
      min_project_budget: {
        type: ["integer", "null"],
        description:
          "Budget minimo dichiarato per un progetto (numero intero, senza simboli). Solo se citato esplicitamente (es. 'da 5.000€', 'starting at €10k').",
      },
      min_project_currency: {
        type: ["string", "null"],
        description: "Codice ISO 4217 valuta del budget minimo (EUR/USD/GBP). Default 'EUR' se non chiaro.",
      },
      typical_project_min: {
        type: ["integer", "null"],
        description: "Estremo inferiore del range progetti tipici, solo se dichiarato.",
      },
      typical_project_max: {
        type: ["integer", "null"],
        description: "Estremo superiore del range progetti tipici, solo se dichiarato.",
      },
      pricing_models: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["fee", "hourly", "performance", "media-commission", "mixed"],
        },
        description:
          "Modello economico dichiarato. Enum: fee (a progetto), hourly (a ore), performance (a risultato), media-commission (commissione media), mixed.",
      },

      // ---- Dictionary: contenuti strutturati ----
      differentiators: {
        type: ["array", "null"],
        items: { type: "string" },
        description:
          "Max 5 elementi distintivi dichiarati con evidenza specifica (frase concisa in italiano, no marketing vuoto). Es: 'metodo proprietario XYZ documentato in whitepaper', 'partnership certificate con Meta', 'team con background editoriale in [ambito]'. Ogni voce deve dire un fatto.",
      },
      declared_methodology: {
        type: ["string", "null"],
        description:
          "Nome + descrizione breve (100-300 char) del metodo proprietario dichiarato dall'agenzia, se presente. Solo se realmente descritto sul sito, non generico.",
      },
      faq: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            q: { type: "string" },
            a: { type: "string" },
          },
          required: ["q", "a"],
        },
        description:
          "Max 8 domande frequenti presenti sul sito (sezione FAQ o simili) con risposta sintetica. Se il sito non ha FAQ, ritorna null.",
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
      "alternate_names",
      "founder_leader",
      "deliverables",
      "platforms_tech",
      "industries",
      "audiences",
      "ideal_client_sizes",
      "engagement_models",
      "min_project_budget",
      "min_project_currency",
      "typical_project_min",
      "typical_project_max",
      "pricing_models",
      "differentiators",
      "declared_methodology",
      "faq",
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
- founder_leader: solo persone REALMENTE presentate come founder/CEO/leader con nome+cognome sulla pagina team/about. Se il ruolo non è esplicito, "role" può essere null. NON dedurre da foto senza didascalia.
- min_project_budget: solo se citato esplicitamente. Rimuovi simboli e separatori (€5.000 → 5000).
- faq: solo se il sito ha una sezione domande/risposte esplicita (accordion FAQ, pagina "domande frequenti", ecc.). NON inventare domande.
- differentiators: SOLO fatti verificabili dal sito con evidenza. NO frasi generiche ("qualità", "innovazione", "eccellenza").

REGOLE per le competenze (tre gruppi obbligatoriamente disgiunti):
- USA ESCLUSIVAMENTE label prese da questa LISTA PERMESSA. Se un servizio dell'agenzia non è nella lista, IGNORALO (non inventare voci nuove).
- competenze_core: max 2 — il servizio attorno al quale gira TUTTA l'attività dell'agenzia (identità principale, ciò che viene per primo nell'headline / meta title / homepage hero). Se non è chiaramente identificabile, ritorna null o [].
- competenze_principali: max 5 — servizi offerti attivamente, con pagina o sezione dedicata sul sito. NON includere qui le voci già in competenze_core.
- altre_competenze: max 10 — servizi complementari o citati marginalmente. NON includere qui voci già in core o principali.
- Nessun duplicato tra i tre gruppi. Usa la label ESATTA della lista (rispetta maiuscole/minuscole).

LISTA PERMESSA (usa solo queste, non inventare):
${allowList}

REGOLE per gli enum stretti (audiences / ideal_client_sizes / engagement_models / pricing_models):
- Usa ESATTAMENTE i valori dell'enum indicato nello schema (es. audiences: solo "b2b", "b2c", "b2g", "nonprofit").
- Se non riesci a stabilire il valore con evidenza, ritorna null (mai un valore inventato).

REGOLE per liste tassonomiche libere (deliverables / platforms_tech / industries):
- Slug kebab-case in italiano (o inglese quando è nome-proprio: 'meta-ads', 'shopify', 'hubspot').
- Solo se supportate da evidenza sul sito (menzione esplicita, case, sezione, cliente citato).
- Preferisci pochi valori corretti a molti valori dubbi.

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
          "Sei un data extractor rigoroso. Rispondi solo con dati verificabili dal testo. Null è meglio di un'invenzione. Per le competenze usa esclusivamente label dalla lista permessa nel prompt. Per gli enum stretti usa solo i valori dichiarati nello schema.",
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

  const int = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : null);

  const jsonArr = <T>(v: unknown): T[] | null =>
    Array.isArray(v) && v.length > 0 ? (v as T[]) : null;

  return {
    descrizione_breve: parsed.descrizione_breve ?? null,
    content: parsed.content ?? null,
    competenze_core: arr(parsed.competenze_core),
    competenze_principali: arr(parsed.competenze_principali),
    altre_competenze: arr(parsed.altre_competenze),
    caratteristiche: arr(parsed.caratteristiche),
    anno_di_fondazione: int(parsed.anno_di_fondazione),
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

    alternate_names: arr(parsed.alternate_names),
    founder_leader: jsonArr<FounderLeaderItem>(parsed.founder_leader),

    deliverables: arr(parsed.deliverables),
    platforms_tech: arr(parsed.platforms_tech),
    industries: arr(parsed.industries),
    audiences: arr(parsed.audiences),
    ideal_client_sizes: arr(parsed.ideal_client_sizes),
    engagement_models: arr(parsed.engagement_models),

    min_project_budget: int(parsed.min_project_budget),
    min_project_currency: parsed.min_project_currency ?? null,
    typical_project_min: int(parsed.typical_project_min),
    typical_project_max: int(parsed.typical_project_max),
    pricing_models: arr(parsed.pricing_models),

    differentiators: arr(parsed.differentiators),
    declared_methodology: parsed.declared_methodology ?? null,
    faq: jsonArr<FaqItem>(parsed.faq),

    confidence: parsed.confidence ?? "low",
  };
}
