"use client";

// Contenuti → Pagine: le pagine del sito con un testo redazionale modificabile.
// Le pagine stesse (e i loro URL) le crea il sito: qui si cambia solo il testo.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDomain } from "@/components/DomainProvider";
import { apiStaff } from "@/components/content/api";
import { ContentNav } from "@/components/content/ContentNav";

interface Riga {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
}

export default function PaginePage() {
  const { currentDomainId, loading: domainLoading } = useDomain();
  const [righe, setRighe] = useState<Riga[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    if (!currentDomainId) return;
    try {
      setRighe((await apiStaff<{ rows: Riga[] }>(`/api/content/pages?domain_id=${currentDomainId}`)).rows);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [currentDomainId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale, come le altre pagine del brain
    if (!domainLoading) carica();
  }, [domainLoading, carica]);

  return (
    <div>
      <h1>Contenuti</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Testi delle pagine del sito. La struttura della pagina resta nel codice del sito.
      </p>
      <ContentNav />
      {errore && <p style={{ color: "var(--red)" }}>{errore}</p>}
      {!righe ? (
        <p className="muted">Caricamento…</p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Pagina</th>
              <th>URL</th>
              <th>Modificata</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/content/pagine/${r.id}`}>{r.title}</Link>
                </td>
                <td className="muted" style={{ fontFamily: "ui-monospace, monospace" }}>
                  /{r.slug}/
                </td>
                <td className="muted">{new Date(r.updated_at).toLocaleDateString("it-IT")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
