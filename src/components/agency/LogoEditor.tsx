"use client";

// Riquadro del logo nella pagina agenzia: anteprima e comandi per impostarlo a mano
// (API /api/agencies/[id]/logo). Un logo impostato qui l'agente Visual Enrichment non lo tocca più.

import { useState } from "react";
import { apiStaff, inputStyle } from "@/components/content/api";

export type LogoMeta = {
  file_name?: string;
  mime_type?: string;
  width?: number | null;
  height?: number | null;
  alt_text?: string;
  description?: string;
  source_url?: string;
  confidence?: number;
  manuale?: boolean;
  rimosso?: boolean;
  updated_at?: string;
} | null;

type Logo = { logo_url: string | null; logo_meta: LogoMeta };

export function LogoEditor({
  agencyId,
  title,
  logo,
  onChange,
}: {
  agencyId: string;
  title: string;
  logo: Logo;
  onChange: (logo: Logo) => void;
}) {
  const [lavoro, setLavoro] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  const esterno = !!logo.logo_url && !logo.logo_url.includes(".supabase.co/storage/");

  async function invia(init: RequestInit) {
    setLavoro(true);
    setErrore(null);
    try {
      onChange(await apiStaff<Logo>(`/api/agencies/${agencyId}/logo`, init));
      setUrl("");
    } catch (e) {
      setErrore((e as Error).message);
    }
    setLavoro(false);
  }
  const daUrl = (u: string) => invia({ method: "POST", body: JSON.stringify({ url: u }) });

  return (
    <div>
      <div className="lb">Logo</div>
      <div
        style={{
          marginTop: 6,
          padding: 10,
          background: "var(--bg3)",
          borderRadius: 6,
          border: "1px solid var(--bd)",
          minHeight: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {logo.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- anteprima di un'immagine remota
          <img
            src={logo.logo_url}
            alt={logo.logo_meta?.alt_text ?? `Logo di ${title}`}
            style={{ maxWidth: "100%", maxHeight: 100, objectFit: "contain" }}
          />
        ) : (
          <span style={{ color: "var(--fg3)", fontSize: 13 }}>{logo.logo_meta?.rimosso ? "Rimosso a mano" : "—"}</span>
        )}
      </div>

      {logo.logo_meta?.manuale && (
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          Impostato a mano: l&apos;agente non lo cambia.
        </p>
      )}
      {esterno && (
        <>
          <p className="muted" style={{ fontSize: 11, marginTop: 6, color: "var(--amber, #d97706)" }}>
            Il logo sta su un sito esterno e può sparire.
          </p>
          <button type="button" className="btn" disabled={lavoro} onClick={() => daUrl(logo.logo_url!)} style={{ marginTop: 4, fontSize: 12 }}>
            Sposta nello storage
          </button>
        </>
      )}

      <label className="btn" style={{ display: "inline-block", marginTop: 8, fontSize: 12 }}>
        Carica un file
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          hidden
          disabled={lavoro}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const fd = new FormData();
            fd.append("file", f);
            invia({ method: "POST", body: fd });
          }}
        />
      </label>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) daUrl(url.trim());
        }}
        style={{ display: "flex", gap: 6, marginTop: 8 }}
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="…o incolla l'URL di un'immagine"
          style={{ ...inputStyle, fontSize: 12, padding: "6px 8px" }}
        />
        <button type="submit" className="btn" disabled={lavoro || !url.trim()} style={{ fontSize: 12 }}>
          Copia
        </button>
      </form>

      {logo.logo_url && (
        <button
          type="button"
          className="btn"
          disabled={lavoro}
          onClick={() => {
            if (confirm("Togliere il logo? Il sito mostrerà quello generico e l'agente non ne cercherà un altro.")) {
              invia({ method: "DELETE" });
            }
          }}
          style={{ marginTop: 8, fontSize: 12, color: "var(--red)" }}
        >
          Rimuovi
        </button>
      )}

      {lavoro && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Salvataggio…</p>}
      {errore && <p style={{ fontSize: 12, marginTop: 6, color: "var(--red)" }}>{errore}</p>}
    </div>
  );
}
