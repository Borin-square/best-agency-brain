// Placeholder: prende output raw (scraping + places + vies)
// e chiama Claude per normalizzare in campi strutturati (descrizione SEO, services, ecc.)

import Anthropic from "@anthropic-ai/sdk";

export interface NormalizedFields {
  description_short: string | null;
  description_long: string | null;
  services: string[] | null;
  founded_year: number | null;
  employees_range: string | null;
}

export async function normalizeWithClaude(raw: {
  scrapedText?: string | null;
  placesData?: unknown;
  viesData?: unknown;
}): Promise<NormalizedFields | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey });
  void client;
  void raw;
  // TODO: prompt + response schema
  return null;
}
