"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  total: number;
  verified: number;
  enriched: number;
  cities: number;
}

interface ImportResult {
  ok: boolean;
  parsed?: number;
  mapped?: number;
  imported?: number;
  errors?: number;
  error?: string;
  error_details?: string[];
  debug?: unknown;
}

interface AgencyRow {
  id: string;
  wp_id: number | null;
  title: string;
  citta: string | null;
  regioni: string | null;
  verifica: string | null;
  status_curatela: string | null;
  google_rating: number | null;
  google_recensioni_count: number | null;
  match_confidence: number | null;
  last_enriched_at: string | null;
}

interface ListResponse {
  rows: AgencyRow[];
  total: number;
  page: number;
  pages: number;
}

export default function AgenziePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [list, setList] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [enriched, setEnriched] = useState<"" | "yes" | "no">("");
  const [showUpload, setShowUpload] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/agencies/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (q.trim()) params.set("q", q.trim());
    if (enriched) params.set("enriched", enriched);
    const res = await fetch(`/api/agencies?${params}`);
    if (res.ok) setList(await res.json());
  }, [page, q, enriched]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadExportUrl = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch("/api/agencies/export-url", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      setExportUrl(data.url);
    }
  }, []);

  useEffect(() => {
    if (showUpload && !exportUrl) loadExportUrl();
  }, [showUpload, exportUrl, loadExportUrl]);

  async function copyExportUrl() {
    if (!exportUrl) return;
    await navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/agencies/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.ok) {
        await loadStats();
        await loadList();
      }
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <h1>Agenzie</h1>
          <p className="muted">Directory miglioreagenzia.it — {stats?.total ?? "…"} record totali.</p>
        </div>
        <button className="btn" onClick={() => setShowUpload((s) => !s)}>
          {showUpload ? "Chiudi" : "Import / Export CSV"}
        </button>
      </div>

      {/* KPI */}
      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Totali</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.total ?? "—"}</div>
        </div>
        <div className="cd">
          <div className="lb">Verified</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.verified ?? "—"}</div>
        </div>
        <div className="cd">
          <div className="lb">Arricchite</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.enriched ?? "—"}</div>
        </div>
        <div className="cd">
          <div className="lb">Città uniche</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.cities ?? "—"}</div>
        </div>
      </div>

      {/* Upload (collassabile) */}
      {showUpload && (
        <div className="cd" style={{ marginTop: 20 }}>
          <div className="lb">Export CSV → WP All Import</div>
          <p className="muted" style={{ marginTop: 4, marginBottom: 10 }}>
            URL pubblico da incollare in WP All Import (schedulazione automatica lato WP).
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 20,
              paddingBottom: 20,
              borderBottom: "1px solid var(--bd)",
            }}
          >
            <input
              type="text"
              value={exportUrl ?? "Caricamento…"}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "var(--bg3)",
                border: "1px solid var(--bd)",
                color: "var(--fg2)",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "ui-monospace, monospace",
              }}
            />
            <button
              className="btn"
              onClick={copyExportUrl}
              disabled={!exportUrl}
              style={{ minWidth: 90 }}
            >
              {copied ? "✓ Copiato" : "Copia"}
            </button>
            {exportUrl && (
              <a
                href={exportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ textDecoration: "none" }}
              >
                Apri
              </a>
            )}
          </div>

          <div className="lb">Import CSV WP All Import</div>
          <p className="muted" style={{ marginTop: 4, marginBottom: 14 }}>
            Upload di un CSV con le 37 colonne del template. Upsert su <code>wp_id</code>.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="btn btn-primary"
            style={{ display: "inline-block", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? "Caricamento…" : "Scegli file CSV"}
          </label>
          {result && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 6,
                background: result.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
                border: `1px solid ${result.ok ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"}`,
                fontSize: 13,
              }}
            >
              {result.ok ? (
                <>
                  <div style={{ color: "var(--grn)", fontWeight: 600, marginBottom: 4 }}>✓ Import completato</div>
                  <div className="muted">
                    Parsed: {result.parsed} · Validi: {result.mapped} · Importati: {result.imported} · Errori: {result.errors}
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--red)" }}>✗ {result.error}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filtri */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Cerca per nome…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            maxWidth: 320,
            padding: "8px 12px",
            background: "var(--bg3)",
            border: "1px solid var(--bd)",
            color: "var(--fg)",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "inherit",
          }}
        />
        <select
          value={enriched}
          onChange={(e) => {
            setEnriched(e.target.value as "" | "yes" | "no");
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            background: "var(--bg3)",
            border: "1px solid var(--bd)",
            color: "var(--fg)",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "inherit",
          }}
        >
          <option value="">Tutte</option>
          <option value="yes">Arricchite</option>
          <option value="no">Non arricchite</option>
        </select>
        {list && (
          <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
            {list.total} risultati · pag {list.page}/{list.pages || 1}
          </span>
        )}
      </div>

      {/* Tabella */}
      <div className="cd" style={{ marginTop: 12, padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Agenzia</th>
              <th>Città</th>
              <th>Verifica</th>
              <th>Google</th>
              <th>Match</th>
              <th>Arricchita</th>
            </tr>
          </thead>
          <tbody>
            {!list ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--fg3)" }}>
                  Caricamento…
                </td>
              </tr>
            ) : list.rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--fg3)" }}>
                  Nessuna agenzia.
                </td>
              </tr>
            ) : (
              list.rows.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => (window.location.href = `/agenzie/${a.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    {a.wp_id && (
                      <div className="muted" style={{ marginTop: 2, fontSize: 11 }}>
                        #{a.wp_id}
                      </div>
                    )}
                  </td>
                  <td>
                    {a.citta ?? "—"}
                    {a.regioni && <span className="muted"> · {a.regioni}</span>}
                  </td>
                  <td>
                    {a.verifica ? (
                      <span
                        className={`bd-badge ${a.verifica === "verified" ? "bd-success" : "bd-muted"}`}
                      >
                        {a.verifica}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {a.google_rating != null ? (
                      <span>
                        ⭐ {a.google_rating}{" "}
                        <span className="muted">({a.google_recensioni_count ?? 0})</span>
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {a.match_confidence != null ? (
                      <span
                        className={`bd-badge ${
                          a.match_confidence >= 0.7
                            ? "bd-success"
                            : a.match_confidence >= 0.4
                              ? "bd-warn"
                              : "bd-error"
                        }`}
                      >
                        {(a.match_confidence * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="muted">
                    {a.last_enriched_at
                      ? new Date(a.last_enriched_at).toLocaleDateString("it-IT")
                      : "mai"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginazione */}
      {list && list.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prec
          </button>
          <span style={{ padding: "8px 12px", color: "var(--fg2)", fontSize: 13 }}>
            {page} / {list.pages}
          </span>
          <button
            className="btn"
            disabled={page >= list.pages}
            onClick={() => setPage((p) => Math.min(list.pages, p + 1))}
          >
            Succ →
          </button>
        </div>
      )}
    </div>
  );
}
