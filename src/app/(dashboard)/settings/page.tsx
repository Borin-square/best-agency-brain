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

interface CompetenzeResult {
  total: number;
  updated: number;
  unchanged: number;
  voci_tenute: number;
  voci_mappate: number;
  voci_scartate: number;
}

export default function SettingsPage() {
  const { currentDomain, currentDomainId } = useDomain();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [runningComp, setRunningComp] = useState(false);
  const [resultComp, setResultComp] = useState<CompetenzeResult | null>(null);
  const [errComp, setErrComp] = useState<string | null>(null);

  async function runBackfillCompetenze() {
    if (!currentDomainId || !currentDomain) return;
    if (
      !confirm(
        `Ricondurre TUTTE le competenze delle agenzie di ${currentDomain.domain} all'allowlist della tab Competenze?\n\nMapping: match esatto → alias predefiniti → similarità token. Voci non riconducibili verranno SCARTATE. Idempotente.`,
      )
    )
      return;
    setRunningComp(true);
    setErrComp(null);
    setResultComp(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch(`/api/agencies/backfill-competenze?domain_id=${currentDomainId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResultComp(json as CompetenzeResult);
    } catch (e) {
      setErrComp((e as Error).message);
    } finally {
      setRunningComp(false);
    }
  }

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

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--bd)" }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Backfill competenze</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Riporta <code>competenze_core</code>, <code>competenze_principali</code>,{" "}
            <code>altre_competenze</code> di tutte le agenzie del dominio all&apos;allowlist
            configurata nella tab <strong>Competenze</strong>. Mapping in ordine: match esatto →
            alias predefiniti (es. <code>ecommerce</code>→<code>e-commerce</code>,{" "}
            <code>meta ads</code>→<code>social-media</code>) → similarità token. Voci non
            riconducibili vengono <strong>scartate</strong>. Idempotente.
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={runBackfillCompetenze}
              disabled={!currentDomainId || runningComp}
            >
              {runningComp ? "In corso…" : "Esegui backfill competenze"}
            </button>
            {currentDomain && (
              <span className="muted" style={{ fontSize: 12 }}>
                Su:{" "}
                <span style={{ marginRight: 4 }}>{countryFlag(currentDomain.country_code)}</span>
                <strong>{currentDomain.domain}</strong>
              </span>
            )}
          </div>
          {errComp && (
            <div style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>✗ {errComp}</div>
          )}
          {resultComp && (
            <div
              className="cd"
              style={{
                marginTop: 12,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 12,
                fontSize: 12,
              }}
            >
              <Stat label="Totale agenzie" value={resultComp.total} />
              <Stat label="Aggiornate" value={resultComp.updated} color="var(--grn)" />
              <Stat label="Invariate" value={resultComp.unchanged} />
              <Stat label="Voci tenute" value={resultComp.voci_tenute} />
              <Stat label="Voci mappate" value={resultComp.voci_mappate} color="var(--grn)" />
              <Stat
                label="Voci scartate"
                value={resultComp.voci_scartate}
                color="var(--red)"
              />
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
