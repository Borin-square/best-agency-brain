"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDomain } from "@/components/DomainProvider";

interface RadarSession {
  session_key: string;
  domain_id: string | null;
  ip: string | null;
  ip_truncated: string | null;
  day: string;
  first_seen_at: string;
  last_seen_at: string;
  pageviews_count: number;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  enriched_at: string | null;
  enrich_error: string | null;
  company_name: string | null;
  company_domain: string | null;
  org: string | null;
  asn: string | null;
  reverse_dns: string | null;
  matched_agency_id: string | null;
  match_score: number | null;
  match_reason: string | null;
  agencies: { id: string; title: string; sito_web: string | null; citta: string | null } | null;
}

export default function RadarPage() {
  const { currentDomainId } = useDomain();
  const [sessions, setSessions] = useState<RadarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [days, setDays] = useState(30);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    setLoading(true);
    setErr(null);
    const params = new URLSearchParams({
      domain_id: currentDomainId,
      days: String(days),
    });
    if (matchedOnly) params.set("matched_only", "1");
    if (q.trim()) params.set("q", q.trim());
    try {
      const res = await fetch(`/api/radar/sessions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setSessions(json.sessions as RadarSession[]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentDomainId, days, matchedOnly, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpi = useMemo(() => {
    const s = { total: sessions.length, matched: 0, enriched: 0, unique_agencies: new Set<string>() };
    for (const r of sessions) {
      if (r.enriched_at) s.enriched++;
      if (r.matched_agency_id) {
        s.matched++;
        s.unique_agencies.add(r.matched_agency_id);
      }
    }
    return { ...s, unique_agencies: s.unique_agencies.size };
  }, [sessions]);

  return (
    <div>
      <h1>Radar</h1>
      <p className="muted">
        Chi ha visitato i siti del network. IP arricchito via IP intelligence + reverse DNS,
        match con le agenzie in DB via dominio/nome (fuzzy).
      </p>

      <div className="grid-4" style={{ marginTop: 20 }}>
        <Kpi label="Sessioni" value={kpi.total} />
        <Kpi label="Arricchite" value={kpi.enriched} />
        <Kpi label="Match agenzia" value={kpi.matched} color="var(--grn)" />
        <Kpi label="Agenzie uniche" value={kpi.unique_agencies} color="var(--grn)" />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          className="inp"
          placeholder="Cerca azienda, org, hostname…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 280 }}
        />
        <select
          className="inp"
          value={String(days)}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
        >
          <option value="7">Ultimi 7 gg</option>
          <option value="30">Ultimi 30 gg</option>
          <option value="90">Ultimi 90 gg</option>
        </select>
        <label
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={matchedOnly}
            onChange={(e) => setMatchedOnly(e.target.checked)}
          />
          Solo match agenzia
        </label>
        <button className="btn btn-secondary" onClick={() => void load()} disabled={loading}>
          {loading ? "…" : "Ricarica"}
        </button>
      </div>

      {err && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 12 }}>✗ {err}</div>}

      {loading ? (
        <p className="muted" style={{ marginTop: 20 }}>Caricamento…</p>
      ) : sessions.length === 0 ? (
        <div className="cd" style={{ marginTop: 20, padding: 20 }}>
          <p className="muted">
            Nessuna sessione. Assicurati che lo snippet <code>/radar-snippet.js</code> sia stato
            installato nel footer del sito e che ci sia stato almeno un visitatore.
          </p>
        </div>
      ) : (
        <div className="cd" style={{ marginTop: 16, padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ultima visita</th>
                <th>Azienda</th>
                <th>Agenzia matchata</th>
                <th>Pageviews</th>
                <th>Origine</th>
                <th>Geo</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_key}>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {new Date(s.last_seen_at).toLocaleString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      first: {new Date(s.first_seen_at).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {s.company_name ?? s.org ?? <span className="muted">—</span>}
                    </div>
                    {s.reverse_dns && (
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                        {s.reverse_dns}
                      </div>
                    )}
                  </td>
                  <td>
                    {s.agencies ? (
                      <>
                        <Link
                          href={`/agenzie/${s.agencies.id}`}
                          style={{ color: "var(--grn)", fontWeight: 600 }}
                        >
                          {s.agencies.title}
                        </Link>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                          {s.match_reason}
                          {typeof s.match_score === "number" && (
                            <> · score {(s.match_score * 100).toFixed(0)}%</>
                          )}
                        </div>
                      </>
                    ) : s.enriched_at ? (
                      <span className="muted">no match</span>
                    ) : (
                      <span className="muted">pending…</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.pageviews_count}</td>
                  <td>
                    <div style={{ fontSize: 11 }}>{s.org ?? "—"}</div>
                    {s.asn && (
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                        {s.asn}
                      </div>
                    )}
                  </td>
                  <td>
                    {s.city && <div>{s.city}</div>}
                    {s.country && (
                      <div className="muted" style={{ fontSize: 11 }}>{s.country}</div>
                    )}
                  </td>
                  <td>
                    <code style={{ fontSize: 10, color: "var(--fg3)" }}>
                      {s.ip ?? s.ip_truncated ?? "—"}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="cd">
      <div className="lb">{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color ?? "var(--fg)" }}>{value}</div>
    </div>
  );
}
