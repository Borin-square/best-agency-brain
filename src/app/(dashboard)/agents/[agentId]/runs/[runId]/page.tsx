"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface RunHeader {
  id: string;
  agent_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  triggered_by: string;
  rows_processed: number;
  rows_success: number;
  rows_error: number;
  duration_ms: number | null;
  log: { entries?: Array<{ ts: string; msg: string; meta?: unknown }> } | null;
  meta: Record<string, unknown> | null;
}

interface RunItem {
  id: string;
  agency_id: string | null;
  status: string;
  sources_hit: Record<string, unknown> | null;
  fields_updated: string[] | null;
  errors: Record<string, unknown> | null;
  duration_ms: number | null;
  agencies: { title: string; citta: string | null } | null;
}

function renderPosition(pos: unknown): string {
  if (pos === null || pos === undefined) return "not found";
  if (typeof pos === "number") return `#${pos}`;
  return String(pos);
}

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ agentId: string; runId: string }>;
}) {
  const { agentId, runId } = use(params);
  const [data, setData] = useState<{ run: RunHeader; items: RunItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agents/runs/${runId}`).then(async (r) => {
      if (r.ok) setData(await r.json());
      setLoading(false);
    });
  }, [runId]);

  if (loading) return <p className="muted">Caricamento…</p>;
  if (!data) return <p className="muted">Run non trovato.</p>;

  const { run, items } = data;
  const isMatriceSerp = run.agent_id === "matrice-serp-position";
  const itemLabel = isMatriceSerp ? "Listing" : "Agenzia";
  const itemLabelPlural = isMatriceSerp ? "Listing processati" : "Agenzie processate";

  return (
    <div>
      <Link href={`/agents/${agentId}`} className="muted" style={{ fontSize: 12 }}>
        ← Torna all&apos;agente
      </Link>
      <h1 style={{ marginTop: 8 }}>Run · {new Date(run.started_at).toLocaleString("it-IT")}</h1>

      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Status</div>
          <span
            className={`bd-badge bd-${
              run.status === "success"
                ? "success"
                : run.status === "error"
                  ? "error"
                  : run.status === "partial"
                    ? "warn"
                    : "info"
            }`}
          >
            {run.status}
          </span>
        </div>
        <div className="cd">
          <div className="lb">Trigger</div>
          <code style={{ fontSize: 11 }}>{run.triggered_by}</code>
        </div>
        <div className="cd">
          <div className="lb">Righe</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {run.rows_success}/{run.rows_processed}
            {run.rows_error > 0 && (
              <span style={{ color: "var(--red)", fontSize: 12, marginLeft: 6 }}>
                ({run.rows_error} err)
              </span>
            )}
          </div>
        </div>
        <div className="cd">
          <div className="lb">Durata</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—"}
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: 28 }}>{itemLabelPlural} ({items.length})</h2>
      <div className="cd" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>{itemLabel}</th>
              <th>Status</th>
              <th>{isMatriceSerp ? "Risultato" : "Campi aggiornati"}</th>
              <th>Fonti</th>
              <th>Errore</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, color: "var(--fg3)" }}>
                  Nessun item registrato.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {isMatriceSerp ? (
                      (() => {
                        const src = (it.sources_hit ?? {}) as {
                          query?: unknown;
                          skill_slug?: unknown;
                          area_slug?: unknown;
                          area_type?: unknown;
                        };
                        const query = typeof src.query === "string" ? src.query : null;
                        const skill = typeof src.skill_slug === "string" ? src.skill_slug : null;
                        const area = typeof src.area_slug === "string" ? src.area_slug : null;
                        const areaType = typeof src.area_type === "string" ? src.area_type : null;
                        return (
                          <>
                            <div style={{ fontWeight: 500 }}>
                              {query ?? "(cella sconosciuta)"}
                            </div>
                            {(skill || area) && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                                {skill && (
                                  <code
                                    style={{
                                      fontSize: 10,
                                      padding: "2px 6px",
                                      background: "var(--bg3)",
                                      borderRadius: 3,
                                      color: "var(--fg2)",
                                    }}
                                  >
                                    {skill}
                                  </code>
                                )}
                                {area && (
                                  <code
                                    style={{
                                      fontSize: 10,
                                      padding: "2px 6px",
                                      background: "var(--bg3)",
                                      borderRadius: 3,
                                      color: "var(--fg2)",
                                    }}
                                  >
                                    {area}
                                    {areaType ? ` (${areaType})` : ""}
                                  </code>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <div style={{ fontWeight: 500 }}>
                          {it.agencies?.title ?? "(agenzia rimossa)"}
                        </div>
                        {it.agencies?.citta && (
                          <div className="muted" style={{ marginTop: 2 }}>
                            {it.agencies.citta}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    <span
                      className={`bd-badge bd-${
                        it.status === "success"
                          ? "success"
                          : it.status === "error"
                            ? "error"
                            : "muted"
                      }`}
                    >
                      {it.status}
                    </span>
                  </td>
                  <td>
                    {isMatriceSerp ? (
                      it.status === "success" ? (
                        (() => {
                          const src = (it.sources_hit ?? {}) as {
                            position?: unknown;
                            agency_count?: unknown;
                          };
                          const pos = renderPosition(src.position);
                          const isFound = typeof src.position === "number";
                          const count =
                            typeof src.agency_count === "number" ? src.agency_count : null;
                          return (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  background: isFound ? "var(--bg3)" : "transparent",
                                  border: isFound ? "none" : "1px dashed var(--fg3)",
                                  borderRadius: 3,
                                  color: isFound ? "var(--fg1)" : "var(--fg3)",
                                }}
                              >
                                {pos}
                              </span>
                              {count !== null && (
                                <span className="muted" style={{ fontSize: 11 }}>
                                  · {count} agenzie
                                </span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span className="muted">—</span>
                      )
                    ) : it.fields_updated && it.fields_updated.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {it.fields_updated.map((f) => (
                          <code
                            key={f}
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              background: "var(--bg3)",
                              borderRadius: 3,
                              color: "var(--fg2)",
                            }}
                          >
                            {f}
                          </code>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {it.sources_hit ? (
                      <code
                        style={{ fontSize: 10, color: "var(--fg2)" }}
                        title={JSON.stringify(it.sources_hit)}
                      >
                        {Object.entries(it.sources_hit)
                          .filter(([, v]) => v === true || (typeof v === "number" && v === 200))
                          .map(([k]) => k)
                          .join(", ") || "—"}
                      </code>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {it.errors ? (
                      <span style={{ color: "var(--red)", fontSize: 11 }}>
                        {typeof it.errors === "object" && it.errors !== null && "message" in it.errors
                          ? String((it.errors as { message: unknown }).message)
                          : JSON.stringify(it.errors)}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {run.log?.entries && run.log.entries.length > 0 && (
        <>
          <h2 style={{ marginTop: 28 }}>Log</h2>
          <div className="cd">
            <pre style={{ fontSize: 11, color: "var(--fg2)", overflow: "auto", maxHeight: 400 }}>
              {run.log.entries
                .map(
                  (e) =>
                    `[${e.ts}] ${e.msg}${e.meta ? " " + JSON.stringify(e.meta) : ""}`,
                )
                .join("\n")}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
