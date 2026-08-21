// Classifica una homepage: è davvero un'agenzia in-scope? Ha almeno un servizio pertinente?

import OpenAI from "openai";
import type { ScrapeResult } from "../../agency-updater/sources/website-scrape";

export interface AgencyClassification {
  is_agency: boolean;
  in_scope: boolean;
  exclusion_reason:
    | null
    | "freelance"
    | "saas_product"
    | "software_house_only"
    | "printer"
    | "media_house"
    | "internal_dept"
    | "association"
    | "inactive"
    | "not_agency"
    | "out_of_geo"
    | "other";
  primary_services: string[];
  location: { city: string | null; country: string | null };
  matches_geo_scope: boolean | null; // null se scope non specificato
  confidence: "high" | "medium" | "low";
  official_name: string | null;
}

const SCHEMA = {
  name: "classify_agency",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      is_agency: { type: "boolean" },
      in_scope: { type: "boolean" },
      exclusion_reason: {
        type: ["string", "null"],
        enum: [
          null,
          "freelance",
          "saas_product",
          "software_house_only",
          "printer",
          "media_house",
          "internal_dept",
          "association",
          "inactive",
          "not_agency",
          "out_of_geo",
          "other",
        ],
      },
      primary_services: { type: "array", items: { type: "string" } },
      location: {
        type: "object",
        additionalProperties: false,
        properties: {
          city: { type: ["string", "null"] },
          country: { type: ["string", "null"] },
        },
        required: ["city", "country"],
      },
      matches_geo_scope: {
        type: ["boolean", "null"],
        description:
          "true = sede chiaramente nel perimetro geografico richiesto. false = fuori scope. null solo se scope non richiesto.",
      },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      official_name: { type: ["string", "null"] },
    },
    required: [
      "is_agency",
      "in_scope",
      "exclusion_reason",
      "primary_services",
      "location",
      "matches_geo_scope",
      "confidence",
      "official_name",
    ],
  },
} as const;

const MODEL = "gpt-4o-mini";

const SCOPE = `marketing/comunicazione, branding/advertising, web design/sviluppo web, e-commerce, SEO, digital advertising/performance, social media, content marketing, video/produzione creativa, influencer marketing, PR, UX/UI/product design, CRM/marketing automation, AI marketing.`;

const EXCLUSIONS = `freelance, software house pure senza servizi marketing, SaaS/prodotti, tipografie senza attività di agenzia, media/case editrici, reparti marketing interni, associazioni/enti, agenzie inattive.`;

export async function classifyAgencyHomepage(
  page: ScrapeResult,
  candidateName: string,
  geoScope: string | null,
): Promise<AgencyClassification | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey });

  const geoRules = geoScope
    ? `\nSCOPE GEOGRAFICO OBBLIGATORIO: "${geoScope}"
- matches_geo_scope = true SOLO se la sede/l'indirizzo sono verificabilmente nel perimetro sopra (città, regione o paese esplicito nel sito).
- Se il sito non mostra indirizzo/città/paese o mostra sede fuori dal perimetro, matches_geo_scope = false.
- Non basarti su lingua del sito o TLD per confermare la sede. Serve un indizio testuale esplicito.
- exclusion_reason = "out_of_geo" se matches_geo_scope = false.`
    : `\nSCOPE GEOGRAFICO: nessuno. Imposta matches_geo_scope = null.`;

  const prompt = `Analizza la homepage per capire se questo è un candidato valido per il database di miglioreagenzia.

IN-SCOPE: ${SCOPE}
ESCLUDERE: ${EXCLUSIONS}
${geoRules}

Regole:
- is_agency = si presenta come agenzia/studio organizzato con team (non un singolo freelance con portfolio)
- in_scope = offre almeno un servizio del catalogo IN-SCOPE
- primary_services = lista lowercase di aree di competenza chiare (es. 'seo', 'branding', 'meta ads')
- location = città/paese solo se chiaramente indicati sul sito
- official_name = nome mostrato in header/logo (senza forma societaria)
- exclusion_reason = motivo principale se non pertinente

Candidato originale: "${candidateName}"
URL analizzato: ${page.final_url}
Meta title: ${page.meta_title ?? "(none)"}

--- TESTO HOMEPAGE ---
${page.text.slice(0, 8000)}
--- FINE ---`;

  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Sei un classificatore rigoroso. Preferisci NON candidato in caso di dubbio (better safe than wrong).",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: SCHEMA },
    });
    const content = res.choices[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as AgencyClassification;
  } catch {
    return null;
  }
}
