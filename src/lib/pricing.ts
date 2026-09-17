// Pricing dinamico per listing miglioreagenzia.it.
//
// Formula base: prezzo_pieno = volume_mensile × CTR(posizione) × CPC × markup
// Poi le 3 slot featured decrescono in % (slot_1_pct, slot_2_pct, slot_3_pct).
//
// La curva CTR è una media di studi pubblicati (AWR, Sistrix, Backlinko 2024)
// per SERP con intento locale. È hardcoded qui — se in futuro vogliamo
// editarla, si sposta in pricing_settings.

/**
 * CTR per posizione 1..100. Per posizioni oltre 20 usiamo un valore residuo.
 * Valori decimali (0.30 = 30%).
 */
export const CTR_CURVE: Record<number, number> = {
  1: 0.30,
  2: 0.15,
  3: 0.1,
  4: 0.07,
  5: 0.05,
  6: 0.04,
  7: 0.03,
  8: 0.025,
  9: 0.02,
  10: 0.02,
  11: 0.015,
  12: 0.012,
  13: 0.01,
  14: 0.009,
  15: 0.008,
  16: 0.007,
  17: 0.006,
  18: 0.005,
  19: 0.004,
  20: 0.004,
};

const CTR_21_30 = 0.003;
const CTR_31_100 = 0.001;

export function ctrForPosition(position: number | null | undefined): number {
  if (position == null) return 0;
  if (position <= 0) return 0;
  if (position <= 20) return CTR_CURVE[position] ?? 0;
  if (position <= 30) return CTR_21_30;
  if (position <= 100) return CTR_31_100;
  return 0;
}

export interface PricingSettings {
  markup: number;
  slot_1_pct: number;
  slot_2_pct: number;
  slot_3_pct: number;
  currency: string;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  markup: 3.0,
  slot_1_pct: 1.0,
  slot_2_pct: 0.7,
  slot_3_pct: 0.5,
  currency: "EUR",
};

export interface PricingInput {
  position: number | null;
  search_volume: number | null;
  cpc: number | null;
}

export interface PricingOutput {
  /** Prezzo pieno (slot 1 al 100%), basato sulla posizione attuale. */
  base_price: number | null;
  slot_1: number | null;
  slot_2: number | null;
  slot_3: number | null;
  /** Prezzo pieno se fossimo in posizione 1 (potenziale). */
  potential_slot_1: number | null;
  ctr: number;
  potential_ctr: number;
}

/**
 * Calcola i prezzi per una cella. Se volume o CPC mancano → tutti null.
 * Se posizione è null → prezzo attuale null (ma potential resta calcolabile
 * se volume/cpc sono presenti).
 */
export function computePrice(
  input: PricingInput,
  settings: PricingSettings,
): PricingOutput {
  const { position, search_volume, cpc } = input;
  const { markup, slot_1_pct, slot_2_pct, slot_3_pct } = settings;

  const ctr = ctrForPosition(position);
  const potentialCtr = ctrForPosition(1);

  const hasVolCpc =
    typeof search_volume === "number" && search_volume > 0 && typeof cpc === "number" && cpc > 0;

  if (!hasVolCpc) {
    return {
      base_price: null,
      slot_1: null,
      slot_2: null,
      slot_3: null,
      potential_slot_1: null,
      ctr,
      potential_ctr: potentialCtr,
    };
  }

  const grossFull = search_volume! * ctr * cpc! * markup;
  const potentialGross = search_volume! * potentialCtr * cpc! * markup;

  const hasPos = typeof position === "number" && position > 0 && ctr > 0;

  return {
    base_price: hasPos ? grossFull : null,
    slot_1: hasPos ? grossFull * slot_1_pct : null,
    slot_2: hasPos ? grossFull * slot_2_pct : null,
    slot_3: hasPos ? grossFull * slot_3_pct : null,
    potential_slot_1: potentialGross * slot_1_pct,
    ctr,
    potential_ctr: potentialCtr,
  };
}
