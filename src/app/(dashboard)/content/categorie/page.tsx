"use client";

// Contenuti → Categorie del magazine. Lo slug nasce dal nome e non cambia: è l'URL /category/{slug}/.

import { useCallback, useEffect, useState } from "react";
import { useDomain } from "@/components/DomainProvider";
import { apiStaff, inputStyle } from "@/components/content/api";
import { ContentNav } from "@/components/content/ContentNav";

interface Categoria {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  article_category_links: { count: number }[];
}

export default function CategoriePage() {
  const { currentDomainId, loading: domainLoading } = useDomain();
  const [righe, setRighe] = useState<Categoria[] | null>(null);
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    if (!currentDomainId) return;
    try {
      setRighe((await apiStaff<{ rows: Categoria[] }>(`/api/content/categories?domain_id=${currentDomainId}`)).rows);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [currentDomainId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale, come le altre pagine del brain
    if (!domainLoading) carica();
  }, [domainLoading, carica]);

  async function crea(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    try {
      await apiStaff("/api/content/categories", { method: "POST", body: JSON.stringify({ domain_id: currentDomainId, name: nome }) });
      setNome("");
      carica();
    } catch (e) {
      setErrore((e as Error).message);
    }
  }

  async function aggiorna(c: Categoria, campi: { name?: string; description?: string }) {
    setErrore(null);
    try {
      await apiStaff(`/api/content/categories/${c.id}`, { method: "PATCH", body: JSON.stringify(campi) });
    } catch (e) {
      setErrore((e as Error).message);
    }
  }

  return (
    <div>
      <h1>Contenuti</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Categorie del magazine. Nome e descrizione si salvano uscendo dal campo.
      </p>
      <ContentNav />
      <form onSubmit={crea} className="cd" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome della nuova categoria" style={inputStyle} />
        <button type="submit" className="btn btn-primary" disabled={!nome.trim()} style={{ whiteSpace: "nowrap" }}>
          + Aggiungi
        </button>
      </form>
      {errore && <p style={{ color: "var(--red)", marginBottom: 12 }}>{errore}</p>}
      {!righe ? (
        <p className="muted">Caricamento…</p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: "28%" }}>Nome</th>
              <th>URL</th>
              <th>Descrizione</th>
              <th>Articoli</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((c) => (
              <tr key={c.id}>
                <td>
                  <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && aggiorna(c, { name: e.target.value })} style={inputStyle} />
                </td>
                <td className="muted" style={{ fontFamily: "ui-monospace, monospace" }}>
                  /category/{c.slug}/
                </td>
                <td>
                  <input
                    defaultValue={c.description ?? ""}
                    onBlur={(e) => e.target.value !== (c.description ?? "") && aggiorna(c, { description: e.target.value })}
                    style={inputStyle}
                  />
                </td>
                <td>{c.article_category_links[0]?.count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
