"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AgentSummary {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  last_run: {
    status: string;
    completed_at: string | null;
    rows_processed: number;
  } | null;
  schedule_config: {
    interval_minutes: number;
    enabled: boolean;
    last_run_at: string | null;
  } | null;
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `Ogni ${minutes} min`;
  if (minutes < 1440) {
    const h = minutes / 60;
    return `Ogni ${h % 1 === 0 ? h : h.toFixed(1)} h`;
  }
  const d = minutes / 1440;
  return `Ogni ${d % 1 === 0 ? d : d.toFixed(1)} g`;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents ?? []);
      }
      setLoading(false);
    }
    load();
    void supabase;
  }, []);

  return (
    <div>
      <h1>Agents</h1>
      <p className="muted">
        Registry degli agenti attivi. Schedule dinamica: modificabile dalla scheda del singolo agente.
      </p>

      <div className="cd" style={{ marginTop: 20, padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Schedule</th>
              <th>Stato</th>
              <th>Ultimo run</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--fg3)", padding: 20 }}>
                  Caricamento…
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--fg3)", padding: 20 }}>
                  Nessun agente configurato.
                </td>
              </tr>
            ) : (
              agents.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {a.description}
                    </div>
                  </td>
                  <td>
                    {a.schedule_config ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {formatInterval(a.schedule_config.interval_minutes)}
                        </div>
                        <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
                          {a.schedule_config.enabled ? "cron on" : "cron off"}
                        </div>
                      </div>
                    ) : a.schedule ? (
                      <code style={{ fontSize: 11, color: "var(--fg2)" }}>{a.schedule}</code>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`bd-badge ${
                        a.schedule_config
                          ? a.schedule_config.enabled
                            ? "bd-success"
                            : "bd-muted"
                          : a.enabled
                            ? "bd-success"
                            : "bd-muted"
                      }`}
                    >
                      {(a.schedule_config?.enabled ?? a.enabled) ? "ATTIVO" : "OFF"}
                    </span>
                  </td>
                  <td>
                    {a.last_run ? (
                      <div>
                        <span
                          className={`bd-badge bd-${
                            a.last_run.status === "success"
                              ? "success"
                              : a.last_run.status === "error"
                                ? "error"
                                : a.last_run.status === "partial"
                                  ? "warn"
                                  : "info"
                          }`}
                        >
                          {a.last_run.status}
                        </span>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {a.last_run.completed_at
                            ? new Date(a.last_run.completed_at).toLocaleString("it-IT")
                            : "in corso"}
                          {" · "}
                          {a.last_run.rows_processed} righe
                        </div>
                      </div>
                    ) : (
                      <span className="muted">mai eseguito</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/agents/${a.id}`} className="btn" style={{ fontSize: 12 }}>
                      Dettaglio
                    </Link>
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
