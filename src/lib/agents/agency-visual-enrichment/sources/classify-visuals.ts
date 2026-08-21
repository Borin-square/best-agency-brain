// LLM classifica un batch di immagini candidate (contesto: alt, sezione, testo circostante,
// pagina di origine) → { logo_candidates, team_candidates } con confidenza.

import OpenAI from "openai";
import type { ExtractedImage } from "./fetch-page";

export interface ImageCandidate extends ExtractedImage {
  page_url: string;
  page_role: "home" | "team_about";
}

export interface LogoClassification {
  src: string;
  is_logo: boolean;
  confidence: number; // 0-1
  reason: string;
}

export interface TeamClassification {
  src: string;
  is_team_photo: boolean;
  team_confidence: number; // 0-1
  reasons: string[];
}

export interface VisualClassification {
  logos: LogoClassification[];
  team_photos: TeamClassification[];
}

const SCHEMA = {
  name: "classify_visuals",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      logos: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            src: { type: "string" },
            is_logo: { type: "boolean" },
            confidence: { type: "number" },
            reason: { type: "string" },
          },
          required: ["src", "is_logo", "confidence", "reason"],
        },
      },
      team_photos: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            src: { type: "string" },
            is_team_photo: { type: "boolean" },
            team_confidence: { type: "number" },
            reasons: { type: "array", items: { type: "string" } },
          },
          required: ["src", "is_team_photo", "team_confidence", "reasons"],
        },
      },
    },
    required: ["logos", "team_photos"],
  },
} as const;

const MODEL = "gpt-4o-mini";

export async function classifyVisuals(
  agencyName: string,
  candidates: ImageCandidate[],
): Promise<VisualClassification | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (candidates.length === 0) return { logos: [], team_photos: [] };

  const client = new OpenAI({ apiKey });

  const items = candidates.slice(0, 40).map((c, i) => ({
    idx: i,
    src: c.src,
    alt: c.alt,
    section: c.in_header ? "header" : c.in_footer ? "footer" : c.in_nav ? "nav" : "body",
    page_role: c.page_role,
    context: c.surrounding_text,
  }));

  const prompt = `Classifica le immagini estratte dal sito dell'agenzia "${agencyName}".

Per ogni immagine devi decidere:
- is_logo: TRUE se è il logo ufficiale dell'agenzia. Alta confidenza se: in header/footer, alt contiene il nome dell'agenzia, filename contiene "logo", è SVG/PNG trasparente. NO se: logo di cliente/partner/premio, icona social, favicon (se c'è alternativa migliore), avatar persona.
- is_team_photo: TRUE se è una fotografia REALE del team dell'agenzia. Alta confidenza (>=0.85) se: sulla pagina team/about, contesto o alt la identifica come team/collettivo. NO se: una sola persona (a meno che sia founder), clienti, evento, pubblico, foto stock, uffici vuoti, edifici, mockup, illustrazioni, AI-generated.

Restituisci un array logos (solo quelle con is_logo=true, oppure il TOP-3 con confidenza) e team_photos (solo con team_confidence dichiarata, tutte le foto valutate).

Regole:
- src DEVE essere ESATTAMENTE l'URL fornito, non modificarlo.
- confidence numerica 0.0-1.0.
- Nessuna invenzione: se non hai contesto sufficiente, confidence bassa.

IMMAGINI:
${JSON.stringify(items, null, 2)}`;

  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Sei un classificatore visivo rigoroso. Preferisci confidenza bassa in caso di dubbio.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: SCHEMA },
    });
    const content = res.choices[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as VisualClassification;
  } catch {
    return null;
  }
}
