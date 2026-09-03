// Completeness score agenzia (0-100).
// Pesi da requisiti prodotto. Ogni check è una funzione pura sui campi agenzia.

export const FIELDS_WEIGHTS = {
  logo: 10,
  description_200char: 15,
  photos_min_3: 10,
  website_active: 10,
  contact_email: 5,
  contact_phone: 5,
  services_selected: 10,
  portfolio_min_3: 15,
  case_studies: 10,
  team_members: 5,
  google_partner_cert: 5,
} as const;

export type ScoreField = keyof typeof FIELDS_WEIGHTS;

const LABELS: Record<ScoreField, string> = {
  logo: "Logo",
  description_200char: "Descrizione > 200 char",
  photos_min_3: "≥ 3 foto",
  website_active: "Sito web",
  contact_email: "Email",
  contact_phone: "Telefono",
  services_selected: "Servizi selezionati",
  portfolio_min_3: "Portfolio (≥ 3 progetti)",
  case_studies: "Case studies",
  team_members: "Info team",
  google_partner_cert: "Google Partner cert.",
};

// Campi agenzia rilevanti per lo scoring. Duck-typed: passiamo solo ciò che serve.
export interface ScorableAgency {
  logo_url?: string | null;
  content?: string | null;
  descrizione_breve?: string | null;
  photos?: unknown; // jsonb array
  sito_web?: string | null;
  email?: string | null;
  telefono?: string | null;
  google_telefono?: string | null;
  competenze_core?: string[] | null;
  competenze_principali?: string[] | null;
  altre_competenze?: string[] | null;
  portfolio?: unknown; // jsonb array
  case_studies?: unknown; // jsonb array
  dimensione_team?: string | null;
  anno_di_fondazione?: number | null;
  google_partner_cert?: boolean | null;
}

function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function nonEmptyStr(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidHttpUrl(v: string | null | undefined): boolean {
  if (!nonEmptyStr(v)) return false;
  try {
    const u = new URL(v!.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const CHECKS: Record<ScoreField, (a: ScorableAgency) => boolean> = {
  logo: (a) => nonEmptyStr(a.logo_url),
  description_200char: (a) => (a.content ?? a.descrizione_breve ?? "").trim().length > 200,
  photos_min_3: (a) => arrLen(a.photos) >= 3,
  website_active: (a) => isValidHttpUrl(a.sito_web),
  contact_email: (a) => nonEmptyStr(a.email),
  contact_phone: (a) => nonEmptyStr(a.telefono) || nonEmptyStr(a.google_telefono),
  services_selected: (a) =>
    arrLen(a.competenze_core) + arrLen(a.competenze_principali) + arrLen(a.altre_competenze) > 0,
  portfolio_min_3: (a) => arrLen(a.portfolio) >= 3,
  case_studies: (a) => arrLen(a.case_studies) > 0,
  team_members: (a) => nonEmptyStr(a.dimensione_team) || (a.anno_di_fondazione ?? 0) > 0,
  google_partner_cert: (a) => a.google_partner_cert === true,
};

export interface ScoreBreakdownItem {
  key: ScoreField;
  label: string;
  weight: number;
  done: boolean;
  earned: number;
}

export interface AgencyScore {
  total: number;                 // 0-100
  breakdown: ScoreBreakdownItem[];
  earnedPoints: number;
  maxPoints: number;             // sempre 100 (somma pesi)
}

export function computeAgencyScore(agency: ScorableAgency): AgencyScore {
  const breakdown: ScoreBreakdownItem[] = (
    Object.keys(FIELDS_WEIGHTS) as ScoreField[]
  ).map((key) => {
    const weight = FIELDS_WEIGHTS[key];
    const done = CHECKS[key](agency);
    return { key, label: LABELS[key], weight, done, earned: done ? weight : 0 };
  });
  const earnedPoints = breakdown.reduce((s, i) => s + i.earned, 0);
  const maxPoints = breakdown.reduce((s, i) => s + i.weight, 0);
  return {
    total: Math.round((earnedPoints / maxPoints) * 100),
    breakdown,
    earnedPoints,
    maxPoints,
  };
}
