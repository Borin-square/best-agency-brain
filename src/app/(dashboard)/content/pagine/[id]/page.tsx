"use client";

// Contenuti → modifica del testo di una pagina del sito.

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiStaff, inputStyle } from "@/components/content/api";
import { ContentNav } from "@/components/content/ContentNav";
import { MarkdownEditor } from "@/components/content/MarkdownEditor";

interface Pagina {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  body_md: string;
  seo_title: string | null;
  meta_description: string | null;
}

export default function PaginaPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Pagina | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [stato, setStato] = useState<string | null>(null);
  const [lavoro, setLavoro] = useState(false);

  const carica = useCallback(async () => {
    try {
      setP(await apiStaff<Pagina>(`/api/content/pages/${id}`));
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale, come le altre pagine del brain
    carica();
  }, [carica]);

  const set = <K extends keyof Pagina>(k: K, v: Pagina[K]) => setP((x) => (x ? { ...x, [k]: v } : x));

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!p) return;
    setLavoro(true);
    setErrore(null);
    try {
      setP(
        await apiStaff<Pagina>(`/api/content/pages/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: p.title,
            subtitle: p.subtitle ?? "",
            body_md: p.body_md,
            seo_title: p.seo_title ?? "",
            meta_description: p.meta_description ?? "",
          }),
        }),
      );
      setStato("Salvato");
      setTimeout(() => setStato(null), 2000);
    } catch (e) {
      setErrore((e as Error).message);
    }
    setLavoro(false);
  }

  if (!p) {
    return (
      <div>
        <ContentNav />
        <p className="muted">{errore ?? "Caricamento…"}</p>
      </div>
    );
  }

  return (
    <form onSubmit={salva}>
      <ContentNav />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0, flex: 1 }}>
          {p.title}{" "}
          <code className="muted" style={{ fontSize: 12 }}>
            /{p.slug}/
          </code>
        </h1>
        {stato && <span style={{ color: "var(--green, #22c55e)", fontSize: 13 }}>✓ {stato}</span>}
        <button type="submit" className="btn btn-primary" disabled={lavoro}>
          {lavoro ? "Salvataggio…" : "Salva"}
        </button>
      </div>
      {errore && <p style={{ color: "var(--red)", marginBottom: 12 }}>{errore}</p>}
      <div className="cd" style={{ marginBottom: 20 }}>
        <div className="lb">Titolo (nel percorso e nel title)</div>
        <input value={p.title} onChange={(e) => set("title", e.target.value)} required style={inputStyle} />
        <div className="lb" style={{ marginTop: 14 }}>
          Titolo grande in testa alla pagina
        </div>
        <input value={p.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} style={inputStyle} />
      </div>
      <div className="cd" style={{ marginBottom: 20 }}>
        <div className="lb">Testo</div>
        <MarkdownEditor value={p.body_md} onChange={(v) => set("body_md", v)} />
      </div>
      <div className="cd">
        <div className="lb">SEO (facoltativi)</div>
        <input
          value={p.seo_title ?? ""}
          onChange={(e) => set("seo_title", e.target.value)}
          placeholder="Title (vuoto: quello predefinito della pagina)"
          style={inputStyle}
        />
        <textarea
          value={p.meta_description ?? ""}
          onChange={(e) => set("meta_description", e.target.value)}
          placeholder="Meta description"
          rows={3}
          style={{ ...inputStyle, marginTop: 10 }}
        />
      </div>
    </form>
  );
}
