"use client";

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
}

export default function AgenziePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/agencies/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
      if (data.ok) await loadStats();
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <h1>Agenzie</h1>
      <p className="muted">Directory miglioreagenzia.it — {stats?.total ?? "…"} record totali.</p>

      {/* KPI cards */}
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

      {/* Import CSV */}
      <div className="cd" style={{ marginTop: 24 }}>
        <div className="lb">Import CSV WP All Import</div>
        <p className="muted" style={{ marginTop: 4, marginBottom: 14 }}>
          Upload di un CSV con le 37 colonne del template. Upsert su <code>wp_id</code>: righe esistenti aggiornate, nuove aggiunte.
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
          style={{
            display: "inline-block",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "Caricamento in corso…" : "Scegli file CSV"}
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
                <div style={{ color: "var(--grn)", fontWeight: 600, marginBottom: 4 }}>
                  ✓ Import completato
                </div>
                <div className="muted">
                  Parsed: {result.parsed} · Validi: {result.mapped} · Importati:{" "}
                  {result.imported} · Errori: {result.errors}
                </div>
              </>
            ) : (
              <>
                <div style={{ color: "var(--red)", fontWeight: 600, marginBottom: 4 }}>
                  ✗ Errore
                </div>
                <div className="muted">{result.error}</div>
                {result.error_details && (
                  <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                    {result.error_details.map((e, i) => (
                      <li key={i} className="muted">
                        {e}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
