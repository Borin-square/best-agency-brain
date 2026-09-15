"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useDomain } from "@/components/DomainProvider";
import ScouterForm from "@/components/ScouterForm";

const SCOUTER_ID = "agency-scouter";

interface Run {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  triggered_by: string;
  rows_processed: number;
  rows_success: number;
  rows_error: number;
  duration_ms: number | null;
  domain_id: string | null;
  network_domains?: { domain: string; country_code: string } | null;
}

interface ScheduleConfig {
  interval_minutes: number;
  enabled: boolean;
  domain_id: string | null;
  refresh_days: number | null;
  batch_size: number | null;
  last_run_at: string | null;
  last_dispatched_at: string | null;
}

interface AgentDetail {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  runs: Run[];
  schedule_config: ScheduleConfig | null;
}

const INTERVAL_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: "Ogni 5 min",   minutes: 5 },
  { label: "Ogni 15 min",  minutes: 15 },
  { label: "Ogni 30 min",  minutes: 30 },
  { label: "Ogni ora",     minutes: 60 },
  { label: "Ogni 2 ore",   minutes: 120 },
  { label: "Ogni 6 ore",   minutes: 360 },
  { label: "Ogni 12 ore",  minutes: 720 },
  { label: "Ogni giorno",  minutes: 1440 },
  { label: "Ogni settimana", minutes: 10080 },
];

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { currentDomainId, currentDomain, domains } = useDomain();
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [runGlobal, setRunGlobal] = useState(false);

  // Schedule form state
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(60);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(true);
  const [scheduleDomain, setScheduleDomain] = useState<string>(""); // "" = globale
  const [refreshDaysInput, setRefreshDaysInput] = useState<string>(""); // "" = default codice
  const [batchSizeInput, setBatchSizeInput] = useState<string>(""); // "" = default codice

  const load = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}`);
    if (res.ok) {
      const data = (await res.json()) as AgentDetail;
      setDetail(data);
      if (data.schedule_config) {
        setIntervalMinutes(data.schedule_config.interval_minutes);
        setScheduleEnabled(data.schedule_config.enabled);
        setScheduleDomain(data.schedule_config.domain_id ?? "");
        setRefreshDaysInput(
          data.schedule_config.refresh_days != null ? String(data.schedule_config.refresh_days) : "",
        );
        setBatchSizeInput(
          data.schedule_config.batch_size != null ? String(data.schedule_config.batch_size) : "",
        );
      }
    }
    setLoading(false);
  }, [agentId]);

  async function saveSchedule() {
    setSavingSchedule(true);
    setScheduleMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch(`/api/agent-schedules/${agentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interval_minutes: intervalMinutes,
          enabled: scheduleEnabled,
          domain_id: scheduleDomain === "" ? null : scheduleDomain,
          refresh_days:
            refreshDaysInput.trim() === "" ? null : Number.parseInt(refreshDaysInput, 10),
          batch_size: batchSizeInput.trim() === "" ? null : Number.parseInt(batchSizeInput, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      setScheduleMsg("✓ Schedule aggiornata");
      await load();
    } catch (e) {
      setScheduleMsg(`✗ ${(e as Error).message}`);
    } finally {
      setSavingSchedule(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function triggerRun() {
    setRunning(true);
    setMsg(null);
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
        body: JSON.stringify(
          runGlobal || !currentDomainId ? {} : { domain_id: currentDomainId },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      setMsg(
        `Completato: ${data.rowsSuccess} success, ${data.rowsError} errori su ${data.rowsProcessed} righe`,
      );
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <p className="muted">Caricamento…</p>;
  if (!detail) return <p className="muted">Agente non trovato.</p>;

  const isScouter = agentId === SCOUTER_ID;

  return (
    <div>
      <Link href="/agents" className="muted" style={{ fontSize: 12 }}>
        ← Tutti gli agenti
      </Link>
      <h1 style={{ marginTop: 8 }}>{detail.name}</h1>
      <p className="muted">{detail.description}</p>

      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Schedule (dispatcher)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            <select
              value={
                INTERVAL_PRESETS.some((p) => p.minutes === intervalMinutes)
                  ? String(intervalMinutes)
                  : "custom"
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "custom") return;
                setIntervalMinutes(parseInt(v, 10));
              }}
              style={selectStyle}
            >
              {INTERVAL_PRESETS.map((p) => (
                <option key={p.minutes} value={p.minutes}>
                  {p.label}
                </option>
              ))}
              {!INTERVAL_PRESETS.some((p) => p.minutes === intervalMinutes) && (
                <option value="custom">Custom: {intervalMinutes} min</option>
              )}
            </select>
            <input
              type="number"
              min={1}
              max={43200}
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Math.max(1, parseInt(e.target.value || "1", 10)))}
              style={selectStyle}
              title="Intervallo in minuti (1..43200)"
            />
            <select
              value={scheduleDomain}
              onChange={(e) => setScheduleDomain(e.target.value)}
              style={selectStyle}
              title="Dominio target del cron. Globale = tutti i domini attivi."
            >
              <option value="">🌐 Globale (tutti i domini attivi)</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.country_code} · {d.domain}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                min={1}
                max={100}
                placeholder="Batch (auto)"
                value={batchSizeInput}
                onChange={(e) => setBatchSizeInput(e.target.value)}
                style={{ ...selectStyle, flex: 1 }}
                title="Agenzie per singolo run. Vuoto = default codice (15 updater, 5 visual)."
              />
              <input
                type="number"
                min={0}
                max={365}
                placeholder="Refresh gg (auto)"
                value={refreshDaysInput}
                onChange={(e) => setRefreshDaysInput(e.target.value)}
                style={{ ...selectStyle, flex: 1 }}
                title="Non ri-processare agenzie arricchite negli ultimi N giorni. 0 = sempre. Vuoto = default (30)."
              />
            </div>
            <label style={{ display: "flex", gap: 6, fontSize: 12, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
              />
              <span>Enabled</span>
            </label>
            <button
              className="btn btn-primary"
              onClick={saveSchedule}
              disabled={savingSchedule}
              style={{ fontSize: 12 }}
            >
              {savingSchedule ? "Salvo…" : "Salva schedule"}
            </button>
            {scheduleMsg && (
              <span
                style={{
                  fontSize: 11,
                  color: scheduleMsg.startsWith("✓") ? "var(--grn)" : "var(--red)",
                }}
              >
                {scheduleMsg}
              </span>
            )}
            {detail.schedule_config?.last_run_at && (
              <span className="muted" style={{ fontSize: 11 }}>
                Ultima esecuzione: {new Date(detail.schedule_config.last_run_at).toLocaleString("it-IT")}
              </span>
            )}
            {detail.schedule_config?.last_run_at && (
              <span className="muted" style={{ fontSize: 11 }}>
                Prossima stimata:{" "}
                {new Date(
                  new Date(detail.schedule_config.last_run_at).getTime() +
                    intervalMinutes * 60000,
                ).toLocaleString("it-IT")}
              </span>
            )}
          </div>
        </div>
        <div className="cd">
          <div className="lb">Stato</div>
          <span className={`bd-badge ${detail.enabled ? "bd-success" : "bd-muted"}`}>
            {detail.enabled ? "ATTIVO" : "OFF"}
          </span>
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
            Registry status. Per fermare l&apos;esecuzione, usa toggle Enabled nello Schedule.
          </div>
        </div>
        {!isScouter && (
          <div className="cd">
            <div className="lb">Trigger manuale</div>
            <button className="btn btn-primary" onClick={triggerRun} disabled={running}>
              {running
                ? "Esecuzione…"
                : runGlobal
                  ? "Esegui globale"
                  : `Esegui su ${currentDomain?.domain ?? "…"}`}
            </button>
            <label style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 11 }}>
              <input
                type="checkbox"
                checked={runGlobal}
                onChange={(e) => setRunGlobal(e.target.checked)}
              />
              <span className="muted">Globale (tutti i domini attivi)</span>
            </label>
            {msg && (
              <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                {msg}
              </p>
            )}
          </div>
        )}
      </div>

      {isScouter && (
        <ScouterForm
          agentId={agentId}
          domainId={currentDomainId}
          domainLabel={currentDomain?.domain ?? "—"}
          onDone={load}
        />
      )}

      <h2 style={{ marginTop: 28 }}>Run history</h2>
      <div className="cd" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Started</th>
              <th>Dominio</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Rows</th>
              <th>Durata</th>
            </tr>
          </thead>
          <tbody>
            {detail.runs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--fg3)" }}>
                  Nessuna esecuzione.
                </td>
              </tr>
            ) : (
              detail.runs.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => (window.location.href = `/agents/${agentId}/runs/${r.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{new Date(r.started_at).toLocaleString("it-IT")}</td>
                  <td style={{ fontSize: 12 }}>
                    {r.network_domains ? (
                      <>
                        <span style={{ marginRight: 4 }}>
                          {r.network_domains.country_code}
                        </span>
                        <span className="muted">{r.network_domains.domain}</span>
                      </>
                    ) : (
                      <span className="muted">globale</span>
                    )}
                  </td>
                  <td>
                    <code style={{ fontSize: 11 }}>{r.triggered_by}</code>
                  </td>
                  <td>
                    <span
                      className={`bd-badge bd-${
                        r.status === "success"
                          ? "success"
                          : r.status === "error"
                            ? "error"
                            : r.status === "partial"
                              ? "warn"
                              : "info"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.rows_success}/{r.rows_processed}
                    {r.rows_error > 0 && (
                      <span style={{ color: "var(--red)", marginLeft: 6 }}>
                        ({r.rows_error} err)
                      </span>
                    )}
                  </td>
                  <td className="muted">
                    {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "var(--bg3)",
  border: "1px solid var(--bd)",
  color: "var(--fg)",
  borderRadius: 6,
  fontSize: 12,
  fontFamily: "inherit",
  width: "100%",
};
