"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDomain, countryFlag } from "@/components/DomainProvider";

interface Skill {
  slug: string;
  label: string;
}

interface Area {
  key: string;
  type: "regione" | "citta";
  slug: string;
  label: string;
  starred: boolean;
  total_agencies: number;
}

interface Coverage {
  skills: Skill[];
  areas: Area[];
  matrix: Record<string, Record<string, number>>; // matrix[areaKey][skillSlug]
}

// Soglie: rosso ≤4, giallo 5-9, verde ≥10, zero = neutro
function cellStyle(n: number): React.CSSProperties {
  if (n === 0) {
    return { background: "var(--bg3)", color: "var(--fg3)" };
  }
  if (n <= 4) {
    return { background: "rgba(239, 68, 68, 0.22)", color: "var(--fg)" };
  }
  if (n <= 9) {
    return { background: "rgba(234, 179, 8, 0.24)", color: "var(--fg)" };
  }
  return { background: "rgba(34, 197, 94, 0.24)", color: "var(--fg)" };
}

export default function MatricePage() {
  const { currentDomain, currentDomainId, loading: domainLoading, reload } = useDomain();
  const [data, setData] = useState<Coverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingStar, setSavingStar] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/matrice/coverage?domain_id=${currentDomainId}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as Coverage);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentDomainId]);

  useEffect(() => {
    if (!domainLoading) load();
  }, [domainLoading, load]);

  async function toggleStar(area: Area) {
    if (!currentDomainId || !data) return;
    setSavingStar(area.key);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");

      const currentStarred = data.areas.filter((a) => a.starred).map((a) => ({ type: a.type, slug: a.slug }));
      const next = area.starred
        ? currentStarred.filter((s) => !(s.type === area.type && s.slug === area.slug))
        : [...currentStarred, { type: area.type, slug: area.slug }];

      const res = await fetch(`/api/network/${currentDomainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ starred_areas: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await Promise.all([load(), reload()]);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingStar(null);
    }
  }

  const starredCount = useMemo(() => (data?.areas ?? []).filter((a) => a.starred).length, [data]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div>
          <h1>Matrice competenze × aree</h1>
          <p className="muted">
            Copertura agenzie per{" "}
            {currentDomain ? (
              <>
                <span style={{ marginRight: 4 }}>{countryFlag(currentDomain.country_code)}</span>
                <strong>{currentDomain.domain}</strong>
              </>
            ) : (
              "il dominio corrente"
            )}
            . Ogni cella = numero di agenzie con quella competenza in quell&apos;area.
            {data && (
              <>
                {" "}
                {data.skills.length} competenze × {data.areas.length} aree ({starredCount} starred).
              </>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 11 }}>
          <span className="muted">Legenda:</span>
          <span style={{ ...cellStyle(1), padding: "3px 8px", borderRadius: 3 }}>≤ 4</span>
          <span style={{ ...cellStyle(5), padding: "3px 8px", borderRadius: 3 }}>5–9</span>
          <span style={{ ...cellStyle(10), padding: "3px 8px", borderRadius: 3 }}>≥ 10</span>
          <span style={{ ...cellStyle(0), padding: "3px 8px", borderRadius: 3 }}>0</span>
        </div>
      </div>

      {err && (
        <div className="cd" style={{ marginTop: 20, color: "var(--red)" }}>
          ✗ {err}
        </div>
      )}

      <div className="cd" style={{ marginTop: 20, padding: 0, overflow: "auto", maxHeight: "calc(100vh - 220px)" }}>
        {domainLoading || loading ? (
          <div style={{ padding: 20, color: "var(--fg3)" }}>Caricamento…</div>
        ) : !data || data.skills.length === 0 ? (
          <div style={{ padding: 20, color: "var(--fg3)" }}>
            Nessuna competenza configurata. Vai su Competenze per aggiungerne.
          </div>
        ) : data.areas.length === 0 ? (
          <div style={{ padding: 20, color: "var(--fg3)" }}>
            Nessuna agenzia con area definita per questo dominio.
          </div>
        ) : (
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: 0,
              width: "max-content",
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 3,
                    background: "var(--bg2)",
                    borderBottom: "1px solid var(--bd)",
                    borderRight: "1px solid var(--bd)",
                    padding: "10px 12px",
                    textAlign: "left",
                    minWidth: 200,
                  }}
                >
                  Competenza
                </th>
                {data.areas.map((a) => (
                  <th
                    key={a.key}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      background: a.starred ? "rgba(234, 179, 8, 0.10)" : "var(--bg2)",
                      borderBottom: "1px solid var(--bd)",
                      borderRight: "1px solid var(--bd)",
                      padding: "8px 10px",
                      textAlign: "center",
                      minWidth: 90,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <button
                        onClick={() => toggleStar(a)}
                        disabled={savingStar === a.key}
                        title={a.starred ? "Rimuovi da starred" : "Aggiungi a starred"}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 2,
                          color: a.starred ? "#eab308" : "var(--fg3)",
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                      >
                        {a.starred ? "★" : "☆"}
                      </button>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{a.label}</span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "var(--fg3)",
                            fontFamily: "ui-monospace, monospace",
                            letterSpacing: 0.5,
                          }}
                        >
                          {a.type === "regione" ? "REG" : "CIT"} · {a.total_agencies}
                        </span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.skills.map((s) => (
                <tr key={s.slug}>
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      background: "var(--bg2)",
                      borderBottom: "1px solid var(--bd)",
                      borderRight: "1px solid var(--bd)",
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </th>
                  {data.areas.map((a) => {
                    const n = data.matrix[a.key]?.[s.slug] ?? 0;
                    return (
                      <td
                        key={a.key}
                        title={`${s.label} × ${a.label}: ${n} agenzie`}
                        style={{
                          ...cellStyle(n),
                          borderBottom: "1px solid var(--bd)",
                          borderRight: "1px solid var(--bd)",
                          padding: "8px 10px",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {n === 0 ? "·" : n}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
