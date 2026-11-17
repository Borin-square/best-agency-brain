"use client";

// Contenuti → Articoli: elenco degli articoli del magazine del dominio corrente.
// Il sito li pubblica al build successivo: salvare qui non cambia subito il sito online.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDomain } from "@/components/DomainProvider";
import { apiStaff, inputStyle } from "@/components/content/api";
import { ContentNav } from "@/components/content/ContentNav";

interface Riga {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "publish";
  published_at: string | null;
  updated_at: string;
  cover_url: string | null;
  article_category_links: { article_categories: { slug: string; name: string } | null }[];
}

const data = (d: string | null) => (d ? new Date(d).toLocaleDateString("it-IT") : "—");

export default function ArticoliPage() {
  const router = useRouter();
  const { currentDomainId, loading: domainLoading } = useDomain();
  const [righe, setRighe] = useState<Riga[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [titolo, setTitolo] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    if (!currentDomainId) return;
    setCaricamento(true);
    try {
      const { rows } = await apiStaff<{ rows: Riga[] }>(`/api/content/articles?domain_id=${currentDomainId}`);
      setRighe(rows);
    } catch (e) {
      setErrore((e as Error).message);
    }
    setCaricamento(false);
  }, [currentDomainId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale, come le altre pagine del brain
    if (!domainLoading) carica();
  }, [domainLoading, carica]);

  async function crea(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    try {
      const { id } = await apiStaff<{ id: string }>("/api/content/articles", {
        method: "POST",
        body: JSON.stringify({ domain_id: currentDomainId, title: titolo }),
      });
      router.push(`/content/articoli/${id}`);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }

  const esterne = righe.filter((r) => r.cover_url && !r.cover_url.includes(".supabase.co/")).length;

  return (
    <div>
      <h1>Contenuti</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Articoli del magazine e testi delle pagine del sito. Le modifiche arrivano sul sito alla pubblicazione successiva.
      </p>
      <ContentNav />

      <form onSubmit={crea} className="cd" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Titolo del nuovo articolo" style={inputStyle} />
        <button type="submit" className="btn btn-primary" disabled={!titolo.trim()} style={{ whiteSpace: "nowrap" }}>
          + Nuova bozza
        </button>
      </form>

      {errore && <p style={{ color: "var(--red)", marginBottom: 12 }}>{errore}</p>}
      {esterne > 0 && (
        <p className="muted" style={{ marginBottom: 12, color: "var(--amber, #d97706)" }}>
          {esterne} {esterne === 1 ? "articolo ha" : "articoli hanno"} ancora la copertina sul vecchio WordPress: apri
          l&apos;articolo e usa &laquo;Sposta nello storage&raquo;.
        </p>
      )}

      {caricamento ? (
        <p className="muted">Caricamento…</p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Titolo</th>
              <th>Stato</th>
              <th>Pubblicato</th>
              <th>Categorie</th>
              <th>Modificato</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/content/articoli/${r.id}`}>{r.title}</Link>
                  <div className="muted" style={{ fontFamily: "ui-monospace, monospace" }}>
                    /{r.slug}/
                  </div>
                </td>
                <td>{r.status === "publish" ? "Pubblicato" : "Bozza"}</td>
                <td>{data(r.published_at)}</td>
                <td className="muted">
                  {r.article_category_links
                    .map((l) => l.article_categories?.name)
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className="muted">{data(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
