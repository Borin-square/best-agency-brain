// Helper condivisi della sezione Contenuti (articoli, pagine, categorie): validazione dei campi in
// arrivo dalle API. Le regole sugli slug degli articoli stanno anche nel DB (trigger della 0034).

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Slug da un titolo: minuscole, senza accenti, trattini al posto di spazi e punteggiatura. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Stringa ripulita o null se vuota: i campi facoltativi non restano "" nel DB. */
export function testoONull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

/** Messaggio leggibile dagli errori di Postgres (i trigger scrivono già in italiano). */
export function messaggioErrore(e: { message?: string; code?: string } | null): string {
  if (!e) return "errore sconosciuto";
  if (e.code === "23505") return "Esiste già un elemento con questo slug.";
  if (e.code === "23514") return "Slug non valido: solo lettere minuscole, numeri e trattini.";
  return e.message ?? "errore sconosciuto";
}
