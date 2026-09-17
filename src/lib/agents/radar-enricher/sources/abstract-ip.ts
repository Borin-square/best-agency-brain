// AbstractAPI IP Intelligence — https://www.abstractapi.com/api/ip-geolocation-api
// Free tier: 20k richieste/mese, 1 req/s.
// Response include: country/city/postal_code/latitude/longitude, connection
// { autonomous_system_organization, autonomous_system_number, isp_name,
//   connection_type, organization_name }, security { is_vpn, is_tor, ... }.
//
// NB: il free tier NON include company.name / company.domain (quelli sono nel
// piano paid "Company API"). Recuperiamo comunque org+asn per matching.
//
// Env: ABSTRACT_API_KEY (senza prefissi).

const API_URL = "https://ip-geolocation.abstractapi.com/v1/";

export interface AbstractIpResult {
  ip: string;
  country: string | null;
  city: string | null;
  organization: string | null; // connection.organization_name
  isp: string | null; // connection.isp_name
  as_org: string | null; // connection.autonomous_system_organization
  asn: string | null; // connection.autonomous_system_number
  is_vpn: boolean;
  raw: unknown;
}

interface AbstractResponse {
  ip_address?: string;
  country?: string;
  city?: string;
  connection?: {
    autonomous_system_number?: number;
    autonomous_system_organization?: string;
    connection_type?: string;
    isp_name?: string;
    organization_name?: string;
  };
  security?: { is_vpn?: boolean };
}

export async function lookupAbstractIp(ip: string): Promise<AbstractIpResult> {
  const apiKey = process.env.ABSTRACT_API_KEY;
  if (!apiKey) throw new Error("ABSTRACT_API_KEY missing");

  const url = `${API_URL}?api_key=${encodeURIComponent(apiKey)}&ip_address=${encodeURIComponent(ip)}&fields=country,city,connection,security`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as AbstractResponse;
  const conn = json.connection ?? {};

  return {
    ip: json.ip_address ?? ip,
    country: json.country ?? null,
    city: json.city ?? null,
    organization: conn.organization_name ?? null,
    isp: conn.isp_name ?? null,
    as_org: conn.autonomous_system_organization ?? null,
    asn:
      typeof conn.autonomous_system_number === "number"
        ? `AS${conn.autonomous_system_number}`
        : null,
    is_vpn: Boolean(json.security?.is_vpn),
    raw: json,
  };
}
