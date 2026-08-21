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
      <p className="muted">Registry degli agenti attivi. Cron config in vercel.json.</p>

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
                    <code style={{ fontSize: 11, color: "var(--fg2)" }}>{a.schedule}</code>
                  </td>
                  <td>
                    <span
                      className={`bd-badge ${a.enabled ? "bd-success" : "bd-muted"}`}
                    >
                      {a.enabled ? "ATTIVO" : "OFF"}
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
