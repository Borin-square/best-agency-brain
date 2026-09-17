"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDomain } from "@/components/DomainProvider";

type IssueType =
  | "blacklist_domain"
  | "dup_place_id"
  | "dup_domain"
  | "dup_vat"
  | "dup_phone"
  | "fuzzy_title_dup"
  | "site_dead"
  | "empty_agency"
  | "test_placeholder"
  | "enrichment_failing";

type Severity = "low" | "medium" | "high";

interface Issue {
  id: string;
  agency_id: string;
  type: IssueType;
  severity: Severity;
  evidence: Record<string, unknown> | null;
  detected_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  resolution: string | null;
  notes: string | null;
  agencies: {
    title: string;
    citta: string | null;
    sito_web: string | null;
    domain_id: string;
  };
}

const TYPE_LABELS: Record<IssueType, string> = {
  blacklist_domain: "Dominio in blacklist",
  dup_place_id: "Google Place duplicato",
  dup_domain: "Dominio sito duplicato",
  dup_vat: "P.IVA duplicata",
  dup_phone: "Telefono duplicato",
  fuzzy_title_dup: "Titolo fuzzy duplicato",
  site_dead: "Sito irraggiungibile",
  empty_agency: "Agenzia vuota",
  test_placeholder: "Test / placeholder",
  enrichment_failing: "Enrichment sempre fallito",
};

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export default function QualityPage() {
  const { currentDomainId, currentDomain } = useDomain();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved" | "all">("open");
  const [typeFilter, setTypeFilter] = useState<"" | IssueType>("");
  const [severityFilter, setSeverityFilter] = useState<"" | Severity>("");
  const [acting, setActing] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    setLoading(true);
    const params = new URLSearchParams({ domain_id: currentDomainId, status: statusFilter });
    if (typeFilter) params.set("type", typeFilter);
    if (severityFilter) params.set("severity", severityFilter);
    const res = await fetch(`/api/agency-issues?${params}`);
    if (res.ok) {
      const data = (await res.json()) as { rows: Issue[] };
      setIssues(data.rows);
    }
    setLoading(false);
  }, [currentDomainId, statusFilter, typeFilter, severityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function authHeader(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Sessione non valida");
    return { Authorization: `Bearer ${token}` };
  }

  async function act(issueId: string, action: "trash" | "ignore" | "fixed") {
    setActing((s) => new Set(s).add(issueId));
    try {
      const h = await authHeader();
      const res = await fetch(`/api/agency-issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing((s) => {
        const n = new Set(s);
        n.delete(issueId);
        return n;
      });
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<IssueType, Issue[]>();
    for (const i of issues) {
      const arr = map.get(i.type) ?? [];
      arr.push(i);
      map.set(i.type, arr);
    }
    // Sort types by max severity within
    const entries = [...map.entries()].sort((a, b) => {
      const maxA = Math.min(...a[1].map((x) => SEVERITY_ORDER[x.severity]));
      const maxB = Math.min(...b[1].map((x) => SEVERITY_ORDER[x.severity]));
      return maxA - maxB;
    });
    return entries;
  }, [issues]);

  const stats = useMemo(() => {
    const byType = new Map<IssueType, number>();
    const bySev: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
    for (const i of issues) {
      byType.set(i.type, (byType.get(i.type) ?? 0) + 1);
      bySev[i.severity]++;
    }
    return { total: issues.length, byType, bySev };
  }, [issues]);

  return (
    <div>
      <h1>Quality</h1>
      <p className="muted">
        Issue di qualità aperte per {currentDomain?.domain ?? "…"}. Prodotte dall&apos;agente{" "}
        <code>agency-quality-check</code>. Blacklist domains e duplicati hard vengono auto-risolti;
        il resto richiede review.
      </p>

      {/* Stats top */}
      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Aperte totali</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{statusFilter === "open" ? stats.total : "—"}</div>
        </div>
        <div className="cd">
          <div className="lb">High severity</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "var(--red)" }}>{stats.bySev.high}</div>
        </div>
        <div className="cd">
          <div className="lb">Medium</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "var(--org, #f59e0b)" }}>{stats.bySev.medium}</div>
        </div>
        <div className="cd">
          <div className="lb">Low</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "var(--fg2)" }}>{stats.bySev.low}</div>
        </div>
      </div>

      {/* Filtri */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "open" | "resolved" | "all")}
          style={inputStyle}
        >
          <option value="open">Aperte</option>
          <option value="resolved">Risolte</option>
          <option value="all">Tutte</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "" | IssueType)}
          style={inputStyle}
        >
          <option value="">Tipo (tutti)</option>
          {(Object.keys(TYPE_LABELS) as IssueType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as "" | Severity)}
          style={inputStyle}
        >
          <option value="">Severity (tutte)</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
          {issues.length} righe
        </span>
      </div>

      {/* Lista raggruppata per tipo */}
      {loading ? (
        <p className="muted" style={{ marginTop: 20 }}>
          Caricamento…
        </p>
      ) : issues.length === 0 ? (
        <div className="cd" style={{ marginTop: 20, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
          <div className="muted">Nessuna issue {statusFilter === "open" ? "aperta" : ""} per questo dominio.</div>
        </div>
      ) : (
        grouped.map(([type, items]) => (
          <div key={type} className="cd" style={{ marginTop: 16, padding: 0 }}>
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--bd)",
                background: "var(--bg2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15 }}>{TYPE_LABELS[type]}</h2>
              <span className="muted" style={{ fontSize: 11 }}>
                {items.length} issue
              </span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Agenzia</th>
                  <th style={{ width: 100 }}>Severity</th>
                  <th>Evidenza</th>
                  <th style={{ width: 120 }}>Detected</th>
                  <th style={{ width: 220 }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const isActing = acting.has(i.id);
                  return (
                    <tr key={i.id}>
                      <td>
                        <Link href={`/agenzie/${i.agency_id}`} style={{ color: "var(--fg)", textDecoration: "none" }}>
                          <div style={{ fontWeight: 500 }}>{i.agencies.title}</div>
                          {i.agencies.citta && (
                            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                              {i.agencies.citta}
                              {i.agencies.sito_web && (
                                <>
                                  {" · "}
                                  <code style={{ fontSize: 10 }}>{i.agencies.sito_web.replace(/^https?:\/\//, "").slice(0, 40)}</code>
                                </>
                              )}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`bd-badge ${
                            i.severity === "high"
                              ? "bd-error"
                              : i.severity === "medium"
                                ? "bd-warn"
                                : "bd-muted"
                          }`}
                        >
                          {i.severity}
                        </span>
                      </td>
                      <td>
                        <EvidencePreview evidence={i.evidence} />
                      </td>
                      <td className="muted" style={{ fontSize: 11 }}>
                        {new Date(i.detected_at).toLocaleDateString("it-IT")}
                        {i.resolved_at && (
                          <div style={{ marginTop: 2, color: "var(--grn)" }}>
                            risolta: {i.resolution}
                          </div>
                        )}
                      </td>
                      <td>
                        {i.resolved_at ? (
                          <span className="muted" style={{ fontSize: 11 }}>—</span>
                        ) : (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="btn"
                              onClick={() => act(i.id, "trash")}
                              disabled={isActing}
                              title="Cestina l'agenzia e chiudi tutte le sue issue"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                            >
                              Trash
                            </button>
                            <button
                              className="btn"
                              onClick={() => act(i.id, "fixed")}
                              disabled={isActing}
                              title="Segna come risolta (evidenza rimossa manualmente)"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                            >
                              Risolta
                            </button>
                            <button
                              className="btn"
                              onClick={() => act(i.id, "ignore")}
                              disabled={isActing}
                              title="Ignora l'issue (non si riaprirà finché evidenza non cambia)"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                            >
                              Ignora
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

function EvidencePreview({ evidence }: { evidence: Record<string, unknown> | null }) {
  if (!evidence || Object.keys(evidence).length === 0) return <span className="muted">—</span>;
  const entries = Object.entries(evidence).slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ fontSize: 11 }}>
          <span className="muted">{k}: </span>
          <code style={{ fontSize: 10, color: "var(--fg2)" }}>
            {Array.isArray(v)
              ? `[${v.length}]`
              : typeof v === "object"
                ? JSON.stringify(v).slice(0, 50)
                : String(v).slice(0, 60)}
          </code>
        </div>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  background: "var(--bg3)",
  border: "1px solid var(--bd)",
  color: "var(--fg)",
  borderRadius: 6,
  fontSize: 12,
  fontFamily: "inherit",
};
