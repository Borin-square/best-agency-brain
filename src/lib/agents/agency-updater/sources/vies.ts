// Placeholder: VIES check per validare P.IVA
// SOAP endpoint pubblico UE: https://ec.europa.eu/taxation_customs/vies/services/checkVatService

export interface ViesResult {
  valid: boolean;
  legal_name: string | null;
  address: string | null;
}

export async function checkVat(country: string, vat: string): Promise<ViesResult | null> {
  void country;
  void vat;
  return null;
}
