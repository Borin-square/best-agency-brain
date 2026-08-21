"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ScouterFormProps {
  agentId: string;
  domainId: string | null;
  domainLabel: string;
  onDone: () => void;
}

interface RunResult {
  ok: boolean;
  rowsProcessed?: number;
  rowsSuccess?: number;
  rowsError?: number;
  meta?: {
    run_summary?: {
      sources_analyzed: number;
      candidates_found: number;
      verified_new: number;
      inserted: number;
      duplicates: number;
      review_required: number;
      rejected: number;
    };
  };
  error?: string;
}

export default function ScouterForm({ agentId, domainId, domainLabel, onDone }: ScouterFormProps) {
  const [directoryUrls, setDirectoryUrls] = useState("");
  const [awardUrls, setAwardUrls] = useState("");
  const [magazineUrls, setMagazineUrls] = useState("");
  const [keywords, setKeywords] = useState("");
  const [geo, setGeo] = useState("");
  const [lang, setLang] = useState("it");
  const [filters, setFilters] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const totalInputs =
    parseList(directoryUrls).length +
    parseList(awardUrls).length +
    parseList(magazineUrls).length +
    parseList(keywords).length;

  async function submit() {
    if (!domainId) {
      setResult({ ok: false, error: "Nessun dominio selezionato in Topbar" });
      return;
    }
    if (totalInputs === 0) {
      setResult({ ok: false, error: "Aggiungi almeno una fonte o una keyword" });
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain_id: domainId,
          payload: {
            directory_urls: parseList(directoryUrls),
            award_urls: parseList(awardUrls),
            magazine_urls: parseList(magazineUrls),
            keywords: parseList(keywords),
            geographic_scope: geo.trim() || null,
            search_languages: [lang],
            additional_filters: filters.trim() || null,
          },
        }),
      });
      const data = (await res.json()) as RunResult;
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult({ ...data, ok: true });
      onDone();
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setRunning(false);
    }
  }

  const s = result?.meta?.run_summary;

  return (
    <div className="cd" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Input scouting</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          Dominio: <b>{domainLabel}</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field
          label="Directory / classifiche (URL, uno per riga)"
          placeholder="https://clutch.co/it/agencies/digital&#10;https://www.sortlist.it/agencies/milano"
          value={directoryUrls}
          onChange={setDirectoryUrls}
        />
        <Field
          label="Premi / festival (URL)"
          placeholder="https://www.mediastars.it/2025/winners&#10;https://www.adci.it/vincitori"
          value={awardUrls}
          onChange={setAwardUrls}
        />
        <Field
          label="Riviste / portali (URL)"
          placeholder="https://www.ninjamarketing.it/top-agenzie-2025&#10;https://www.engage.it/tag/agenzie"
          value={magazineUrls}
          onChange={setMagazineUrls}
        />
        <Field
          label="Keyword SERP (una per riga)"
          placeholder="agenzia seo&#10;agenzia meta ads&#10;branding studio"
          value={keywords}
          onChange={setKeywords}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: 14, marginTop: 14 }}>
        <div>
          <div className="lb">Scope geografico</div>
          <input
            type="text"
            value={geo}
            placeholder="es. Milano, Lombardia, Italia"
            onChange={(e) => setGeo(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <div className="lb">Lingua</div>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={inputStyle}>
            <option value="it">🇮🇹 Italiano</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="fr">🇫🇷 Français</option>
          </select>
        </div>
        <div>
          <div className="lb">Filtri extra (free text)</div>
          <input
            type="text"
            value={filters}
            placeholder="es. solo B-Corp, min 10 dipendenti…"
            onChange={(e) => setFilters(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={running || totalInputs === 0 || !domainId}
          title={!domainId ? "Seleziona un dominio nel Topbar" : undefined}
        >
          {running ? "Scouting in corso…" : `Avvia scouting (${totalInputs} input)`}
        </button>
        <span className="muted" style={{ fontSize: 11 }}>
          Cap: 20 candidati per run · ~2-5 min tipici
        </span>
      </div>

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 8,
            background: result.ok ? "rgba(34,197,94,.06)" : "rgba(239,68,68,.06)",
            border: `1px solid ${result.ok ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
            fontSize: 13,
          }}
        >
          {result.ok ? (
            <>
              <div style={{ color: "var(--grn)", fontWeight: 600, marginBottom: 8 }}>
                ✓ Scouting completato
              </div>
              {s && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, fontSize: 12 }}>
                  <Kpi label="Fonti" value={s.sources_analyzed} />
                  <Kpi label="Candidati" value={s.candidates_found} />
                  <Kpi label="Verified new" value={s.verified_new} color="var(--grn)" />
                  <Kpi label="Inseriti" value={s.inserted} color="var(--grn)" />
                  <Kpi label="Duplicati" value={s.duplicates} color="var(--fg3)" />
                  <Kpi label="Review" value={s.review_required} color="#eab308" />
                </div>
              )}
              <div className="muted" style={{ marginTop: 8, fontSize: 11 }}>
                Vedi il run detail per il report completo (agencies + errors).
              </div>
            </>
          ) : (
            <div style={{ color: "var(--red)" }}>✗ {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const count = parseList(value).length;
  return (
    <div>
      <div className="lb" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        {count > 0 && <span style={{ color: "var(--fg2)", fontWeight: 600 }}>{count}</span>}
      </div>
      <textarea
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
      />
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="lb" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: color ?? "var(--fg)" }}>{value}</div>
    </div>
  );
}

function parseList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg3)",
  border: "1px solid var(--bd)",
  color: "var(--fg)",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
};
