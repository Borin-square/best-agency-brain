"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
}

interface AgentDetail {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  runs: Run[];
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}`);
    if (res.ok) setDetail(await res.json());
    setLoading(false);
  }, [agentId]);

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
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <div>
      <Link href="/agents" className="muted" style={{ fontSize: 12 }}>
        ← Tutti gli agenti
      </Link>
      <h1 style={{ marginTop: 8 }}>{detail.name}</h1>
      <p className="muted">{detail.description}</p>

      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Schedule</div>
          <code style={{ fontSize: 14 }}>{detail.schedule}</code>
        </div>
        <div className="cd">
          <div className="lb">Stato</div>
          <span className={`bd-badge ${detail.enabled ? "bd-success" : "bd-muted"}`}>
            {detail.enabled ? "ATTIVO" : "OFF"}
          </span>
        </div>
        <div className="cd">
          <div className="lb">Trigger manuale</div>
          <button className="btn btn-primary" onClick={triggerRun} disabled={running}>
            {running ? "Esecuzione…" : "Esegui ora"}
          </button>
          {msg && (
            <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              {msg}
            </p>
          )}
        </div>
      </div>

      <h2 style={{ marginTop: 28 }}>Run history</h2>
      <div className="cd" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Started</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Rows</th>
              <th>Durata</th>
            </tr>
          </thead>
          <tbody>
            {detail.runs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, color: "var(--fg3)" }}>
                  Nessuna esecuzione.
                </td>
              </tr>
            ) : (
              detail.runs.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.started_at).toLocaleString("it-IT")}</td>
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
