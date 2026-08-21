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
    | "other";
  primary_services: string[]; // slug del catalogo scope (branding, seo, meta_ads, ...)
  location: { city: string | null; country: string | null };
  confidence: "high" | "medium" | "low";
  official_name: string | null; // nome ufficiale come appare sul sito
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
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      official_name: { type: ["string", "null"] },
    },
    required: [
      "is_agency",
      "in_scope",
      "exclusion_reason",
      "primary_services",
      "location",
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
): Promise<AgencyClassification | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey });

  const prompt = `Analizza la homepage per capire se questo è un candidato valido per il database di miglioreagenzia.it.

IN-SCOPE: ${SCOPE}
ESCLUDERE: ${EXCLUSIONS}

Regole:
- is_agency = si presenta come agenzia/studio organizzato con team (non un singolo freelance con portfolio)
- in_scope = offre almeno un servizio del catalogo IN-SCOPE
- exclusion_reason = se in_scope=false o is_agency=false, indica il motivo principale
- primary_services = lista lowercase di aree di competenza chiare (es. 'seo', 'branding', 'meta ads')
- location = città/paese solo se chiaramente indicati
- official_name = nome mostrato in header/logo (senza forma societaria)

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
