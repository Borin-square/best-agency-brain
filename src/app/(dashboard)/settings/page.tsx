"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDomain, countryFlag } from "@/components/DomainProvider";

interface BackfillResult {
  total: number;
  updated: number;
  unchanged: number;
  no_address: number;
  not_parsed: number;
}

export default function SettingsPage() {
  const { currentDomain, currentDomainId } = useDomain();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function runBackfillGeo() {
    if (!currentDomainId || !currentDomain) return;
    if (
      !confirm(
        `Riparsa citta/regioni/aree di TUTTE le agenzie di ${currentDomain.domain}?\n\nUsa google_indirizzo/indirizzo_completo già salvato (no API calls). Idempotente.`,
      )
    )
      return;
    setRunning(true);
    setErr(null);
    setResult(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch(`/api/agencies/backfill-geo?domain_id=${currentDomainId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(json as BackfillResult);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h1>Settings</h1>
      <p className="muted">API keys, users, cron config.</p>

      <div className="cd" style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 6, borderBottom: "1px solid var(--bd)", paddingBottom: 8 }}>
          Manutenzione
        </h2>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Backfill geo</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Riparsa <code>google_indirizzo</code> di tutte le agenzie del dominio corrente e
            riscrive <code>citta</code>, <code>regioni</code>, <code>aree</code> col formato
            aggiornato (<strong>provincia</strong> invece del comune). Nessuna chiamata a Google
            Places o LLM. Idempotente.
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={runBackfillGeo}
              disabled={!currentDomainId || running}
            >
              {running ? "In corso…" : "Esegui backfill"}
            </button>
            {currentDomain && (
              <span className="muted" style={{ fontSize: 12 }}>
                Su:{" "}
                <span style={{ marginRight: 4 }}>{countryFlag(currentDomain.country_code)}</span>
                <strong>{currentDomain.domain}</strong>
              </span>
            )}
          </div>
          {err && (
            <div style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>✗ {err}</div>
          )}
          {result && (
            <div
              className="cd"
              style={{
                marginTop: 12,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12,
                fontSize: 12,
              }}
            >
              <Stat label="Totale" value={result.total} />
              <Stat label="Aggiornate" value={result.updated} color="var(--grn)" />
              <Stat label="Invariate" value={result.unchanged} />
              <Stat label="Senza indirizzo" value={result.no_address} color="var(--fg3)" />
              <Stat label="Non parsabili" value={result.not_parsed} color="var(--yel, #eab308)" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="lb">{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color ?? "var(--fg)" }}>{value}</div>
    </div>
  );
}
