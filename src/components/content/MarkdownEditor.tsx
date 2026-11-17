"use client";

// Testo in Markdown con anteprima. L'anteprima usa la stessa libreria (marked) con cui il sito
// trasforma il testo in HTML, quindi mostra quello che uscirà in pagina (senza la grafica del sito).

import { useMemo, useState } from "react";
import { marked } from "marked";
import { inputStyle } from "./api";

export function MarkdownEditor({ value, onChange, righe = 24 }: { value: string; onChange: (v: string) => void; righe?: number }) {
  const [vista, setVista] = useState<"scrivi" | "anteprima">("scrivi");
  const html = useMemo(() => (vista === "anteprima" ? (marked.parse(value, { async: false }) as string) : ""), [vista, value]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
        {(["scrivi", "anteprima"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`btn${vista === v ? " btn-primary" : ""}`}
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => setVista(v)}
          >
            {v === "scrivi" ? "Scrivi" : "Anteprima"}
          </button>
        ))}
        <span className="muted" style={{ marginLeft: 8 }}>
          ## Titolo · **grassetto** · *corsivo* · [testo](/url/) · - elenco · --- separatore
        </span>
      </div>
      {vista === "scrivi" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={righe}
          spellCheck
          style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
        />
      ) : (
        <div
          className="cd md-anteprima"
          style={{ lineHeight: 1.7, fontSize: 14, maxHeight: 700, overflow: "auto" }}
          // Testo scritto dallo staff nel brain: fidato.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
