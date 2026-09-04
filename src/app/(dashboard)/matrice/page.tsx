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
  matrix: Record<string, Record<string, number>>;
  featured: Record<string, Record<string, number>>;
}

interface FeaturedRow {
  id: string;
  agency_id: string;
  area_type: "regione" | "citta";
  area_slug: string;
  skill_slug: string;
  sort_order: number;
  agencies: {
    id: string;
    title: string;
    citta: string | null;
    regioni: string | null;
    verifica: string | null;
  };
}

interface CandidateRow {
  id: string;
  title: string;
  citta: string | null;
  regioni: string | null;
  verifica: string | null;
}

// Soglie: rosso ≤4, giallo 5-9, verde ≥10, zero = neutro
function cellStyle(n: number): React.CSSProperties {
  if (n === 0) return { background: "var(--bg3)", color: "var(--fg3)" };
  if (n <= 4) return { background: "rgba(239, 68, 68, 0.22)", color: "var(--fg)" };
  if (n <= 9) return { background: "rgba(234, 179, 8, 0.24)", color: "var(--fg)" };
  return { background: "rgba(34, 197, 94, 0.24)", color: "var(--fg)" };
}

export default function MatricePage() {
  const { currentDomain, currentDomainId, loading: domainLoading, reload } = useDomain();
  const [data, setData] = useState<Coverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingStar, setSavingStar] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ area: Area; skill: Skill } | null>(null);

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
            . Ogni cella = numero di agenzie con quella competenza in quell&apos;area. Click su una cella per gestire le <strong>featured</strong>.
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
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "max-content", fontSize: 12 }}>
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
                    const feat = data.featured[a.key]?.[s.slug] ?? 0;
                    return (
                      <td
                        key={a.key}
                        title={`${s.label} × ${a.label}: ${n} agenzie${feat ? `, ${feat} featured` : ""}`}
                        onClick={() => setSelected({ area: a, skill: s })}
                        style={{
                          ...cellStyle(n),
                          borderBottom: "1px solid var(--bd)",
                          borderRight: "1px solid var(--bd)",
                          padding: "8px 10px",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        {n === 0 ? "·" : n}
                        {feat > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 4,
                              fontSize: 9,
                              color: "#eab308",
                              fontWeight: 600,
                            }}
                          >
                            ★{feat}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && currentDomainId && (
        <FeaturedPanel
          domainId={currentDomainId}
          area={selected.area}
          skill={selected.skill}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function FeaturedPanel({
  domainId,
  area,
  skill,
  onClose,
  onChanged,
}: {
  domainId: string;
  area: Area;
  skill: Skill;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [featured, setFeatured] = useState<FeaturedRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const params = useMemo(
    () => `domain_id=${domainId}&area_type=${area.type}&area_slug=${area.slug}&skill=${skill.slug}`,
    [domainId, area, skill],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fr, cr] = await Promise.all([
        fetch(`/api/features?${params}`),
        fetch(`/api/features/candidates?${params}${q ? `&q=${encodeURIComponent(q)}` : ""}`),
      ]);
      if (fr.ok) {
        const j = (await fr.json()) as { rows: FeaturedRow[] };
        setFeatured(j.rows);
      }
      if (cr.ok) {
        const j = (await cr.json()) as { rows: CandidateRow[] };
        setCandidates(j.rows);
      }
    } finally {
      setLoading(false);
    }
  }, [params, q]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function authHeader(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Sessione non valida");
    return { Authorization: `Bearer ${token}` };
  }

  async function addFeatured(agencyId: string) {
    setBusy(true);
    setErr(null);
    try {
      const h = await authHeader();
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({
          agency_id: agencyId,
          area_type: area.type,
          area_slug: area.slug,
          skill_slug: skill.slug,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await loadAll();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeFeatured(id: string) {
    setBusy(true);
    setErr(null);
    try {
      const h = await authHeader();
      const res = await fetch(`/api/features/${id}`, { method: "DELETE", headers: h });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await loadAll();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = featured.findIndex((r) => r.id === id);
    const swap = featured[idx + dir];
    if (!swap) return;
    setBusy(true);
    setErr(null);
    try {
      const h = await authHeader();
      await Promise.all([
        fetch(`/api/features/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...h },
          body: JSON.stringify({ sort_order: swap.sort_order }),
        }),
        fetch(`/api/features/${swap.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...h },
          body: JSON.stringify({ sort_order: featured[idx].sort_order }),
        }),
      ]);
      await loadAll();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: "100vw",
          height: "100%",
          background: "var(--bg2)",
          borderLeft: "1px solid var(--bd)",
          overflow: "auto",
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="lb">Featured</div>
            <h2 style={{ margin: "4px 0 0" }}>
              {skill.label} × {area.label}
            </h2>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
              {area.type === "regione" ? "Regione" : "Città"} · {area.slug}
            </div>
          </div>
          <button className="btn" onClick={onClose} style={{ fontSize: 11 }}>
            Chiudi
          </button>
        </div>

        {err && (
          <div style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>✗ {err}</div>
        )}

        <div style={{ marginTop: 20 }}>
          <div className="lb" style={{ marginBottom: 8 }}>
            Attualmente featured ({featured.length})
          </div>
          {loading ? (
            <div className="muted" style={{ fontSize: 12 }}>Caricamento…</div>
          ) : featured.length === 0 ? (
            <div className="muted" style={{ fontSize: 12 }}>Nessuna. Aggiungi dai candidati sotto.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {featured.map((f, i) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: "var(--bg3)",
                    borderRadius: 4,
                    border: "1px solid var(--bd)",
                  }}
                >
                  <span
                    style={{
                      minWidth: 22,
                      textAlign: "center",
                      fontSize: 12,
                      color: "#eab308",
                      fontWeight: 600,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 13 }}>
                    {f.agencies.title}
                    {f.agencies.verifica === "verified" && (
                      <span
                        className="bd-badge bd-success"
                        style={{ marginLeft: 6, fontSize: 9 }}
                      >
                        verified
                      </span>
                    )}
                    <span className="muted" style={{ fontSize: 10, marginLeft: 6 }}>
                      {f.agencies.citta ?? "—"}
                    </span>
                  </span>
                  <button
                    className="btn"
                    disabled={busy || i === 0}
                    onClick={() => move(f.id, -1)}
                    style={{ fontSize: 10, padding: "3px 6px" }}
                  >
                    ↑
                  </button>
                  <button
                    className="btn"
                    disabled={busy || i === featured.length - 1}
                    onClick={() => move(f.id, 1)}
                    style={{ fontSize: 10, padding: "3px 6px" }}
                  >
                    ↓
                  </button>
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => removeFeatured(f.id)}
                    title="Rimuovi"
                    style={{ fontSize: 10, padding: "3px 6px" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="lb" style={{ marginBottom: 8 }}>
            Candidati (tutte le agenzie del dominio, non ancora featured qui)
          </div>
          <input
            type="text"
            placeholder="Cerca per nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--bg3)",
              border: "1px solid var(--bd)",
              color: "var(--fg)",
              borderRadius: 6,
              fontSize: 13,
              fontFamily: "inherit",
              marginBottom: 10,
            }}
          />
          {candidates.length === 0 ? (
            <div className="muted" style={{ fontSize: 12 }}>Nessun candidato disponibile.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 400, overflow: "auto" }}>
              {candidates.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 4,
                    background: "var(--bg3)",
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12 }}>
                    {c.title}
                    {c.verifica === "verified" && (
                      <span
                        className="bd-badge bd-success"
                        style={{ marginLeft: 6, fontSize: 9 }}
                      >
                        verified
                      </span>
                    )}
                    <span className="muted" style={{ fontSize: 10, marginLeft: 6 }}>
                      {c.citta ?? "—"}{c.regioni ? ` · ${c.regioni}` : ""}
                    </span>
                  </span>
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => addFeatured(c.id)}
                    style={{ fontSize: 10, padding: "3px 8px" }}
                  >
                    + Featura
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
