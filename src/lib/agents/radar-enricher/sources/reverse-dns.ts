// Reverse DNS lookup usando l'API DNS nativa di Node.
import { promises as dnsPromises } from "dns";

/**
 * Ritorna il primo PTR record per l'IP, oppure null se non c'è o timeout.
 * Timeout hard a 3 secondi per non bloccare l'enrichment.
 */
export async function reverseDns(ip: string, timeoutMs = 3000): Promise<string | null> {
  const resolver = new dnsPromises.Resolver({ timeout: timeoutMs, tries: 1 });
  try {
    const names = await resolver.reverse(ip);
    return names?.[0] ?? null;
  } catch {
    return null;
  }
}
