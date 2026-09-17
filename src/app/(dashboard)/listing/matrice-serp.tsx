"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDomain } from "@/components/DomainProvider";

interface Skill {
  slug: string;
  label: string;
  query_modifier: string;
}

interface Area {
  key: string;
  type: "regione" | "citta";
  slug: string;
  label: string;
  starred: boolean;
  total_agencies: number;
}

interface SerpCell {
  position: number | null;
  url: string | null;
  query: string;
  checked_at: string;
}

interface SerpCoverage {
  skills: Skill[];
  areas: Area[];
  agency_matrix: Record<string, Record<string, number>>;
  serp_matrix: Record<string, Record<string, SerpCell>>;
  min_agencies_threshold: number;
}

type CellKind = "top10" | "top30" | "top100" | "out" | "pending" | "below";

interface CellDescriptor {
  kind: CellKind;
  style: React.CSSProperties;
  text: string;
}

function serpCellStyle(kind: CellKind): React.CSSProperties {
  switch (kind) {
    case "top10":
      return { background: "rgba(34,197,94,0.24)", color: "var(--fg)" };
    case "top30":
      return { background: "rgba(234,179,8,0.24)", color: "var(--fg)" };
    case "top100":
      return { background: "rgba(249,115,22,0.24)", color: "var(--fg)" };
    case "out":
      return { background: "rgba(107,114,128,0.20)", color: "var(--fg2)" };
    case "pending":
      return { background: "var(--bg3)", color: "var(--fg3)" };
    case "below":
      return { background: "var(--bg2)", color: "var(--fg3)" };
  }
}

function describeCell(
  serp: SerpCell | undefined,
  agencyCount: number,
  threshold: number,
): CellDescriptor {
  if (serp) {
    const p = serp.position;
    if (p !== null && p <= 10) return { kind: "top10", style: serpCellStyle("top10"), text: `#${p}` };
    if (p !== null && p <= 30) return { kind: "top30", style: serpCellStyle("top30"), text: `#${p}` };
    if (p !== null && p <= 100) return { kind: "top100", style: serpCellStyle("top100"), text: `#${p}` };
    return { kind: "out", style: serpCellStyle("out"), text: ">100" };
  }
  if (agencyCount >= threshold) {
    return { kind: "pending", style: serpCellStyle("pending"), text: "—" };
  }
  return { kind: "below", style: serpCellStyle("below"), text: "·" };
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

interface SelectedCell {
  area: Area;
  skill: Skill;
  serp: SerpCell | undefined;
  agencyCount: number;
  descriptor: CellDescriptor;
}

export default function MatriceSerp() {
  const { currentDomainId, loading: domainLoading } = useDomain();
  const [data, setData] = useState<SerpCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/matrice/serp-coverage?domain_id=${currentDomainId}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as SerpCoverage);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentDomainId]);

  useEffect(() => {
    if (!domainLoading) load();
  }, [domainLoading, load]);

  const stats = useMemo(() => {
    if (!data) return { scanned: 0, eligible: 0, hasAny: false };
    let scanned = 0;
    let eligible = 0;
    let hasAny = false;
    for (const area of data.areas) {
      for (const skill of data.skills) {
        const agencyCount = data.agency_matrix[area.key]?.[skill.slug] ?? 0;
        const serp = data.serp_matrix[area.key]?.[skill.slug];
        if (agencyCount >= data.min_agencies_threshold) eligible += 1;
        if (serp) {
          scanned += 1;
          hasAny = true;
        }
      }
    }
    return { scanned, eligible, hasAny };
  }, [data]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Matrice posizione SERP</h2>
          <p className="muted">
            Posizione miglioreagenzia.it in Google per ogni cella (area × competenza) con almeno{" "}
            {data?.min_agencies_threshold ?? 5} agenzie.
            {data && (
              <>
                {" "}
                <strong>{stats.scanned}</strong> celle scansionate su <strong>{stats.eligible}</strong> totali &ge; soglia.
              </>
            )}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            fontSize: 11,
            justifyContent: "flex-end",
            maxWidth: 560,
          }}
        >
          <span className="muted">Legenda:</span>
          <span style={{ ...serpCellStyle("top10"), padding: "3px 8px", borderRadius: 3 }}>Top 10</span>
          <span style={{ ...serpCellStyle("top30"), padding: "3px 8px", borderRadius: 3 }}>Top 11–30</span>
          <span style={{ ...serpCellStyle("top100"), padding: "3px 8px", borderRadius: 3 }}>Top 31–100</span>
          <span style={{ ...serpCellStyle("out"), padding: "3px 8px", borderRadius: 3 }}>&gt;100</span>
          <span
            style={{
              ...serpCellStyle("pending"),
              padding: "3px 8px",
              borderRadius: 3,
              border: "1px solid var(--bd)",
            }}
          >
            Non ancora scansionata
          </span>
          <span
            style={{
              ...serpCellStyle("below"),
              padding: "3px 8px",
              borderRadius: 3,
              border: "1px solid var(--bd)",
            }}
          >
            Sotto soglia
          </span>
        </div>
      </div>

      {err && (
        <div className="cd" style={{ marginTop: 20, color: "var(--red)" }}>
          ✗ {err}
        </div>
      )}

      <div className="cd" style={{ marginTop: 20, padding: 0, overflow: "auto", maxHeight: "calc(100vh - 260px)" }}>
        {domainLoading || loading ? (
          <div style={{ padding: 20, color: "var(--fg3)" }}>Caricamento…</div>
        ) : !data || data.skills.length === 0 ? (
          <div style={{ padding: 20, color: "var(--fg3)" }}>
            Nessuna competenza configurata. Vai su Competenze per aggiungerne.
          </div>
        ) : data.areas.length === 0 ? (
          <div style={{ padding: 20, color: "var(--fg3)" }}>
            Nessuna area disponibile per questo dominio.
          </div>
        ) : !stats.hasAny ? (
          <div style={{ padding: 20, color: "var(--fg3)" }}>
            Nessuna cella scansionata ancora. L&apos;agente <code>matrice-serp-position</code> gira weekly, aspetta il prossimo run o triggeralo manualmente da Agents.
          </div>
        ) : (
          <table
            className="tbl"
            style={{ borderCollapse: "separate", borderSpacing: 0, width: "max-content", fontSize: 12 }}
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
                    minWidth: 220,
                  }}
                >
                  Area
                </th>
                {data.skills.map((s) => (
                  <th
                    key={s.slug}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      background: "var(--bg2)",
                      borderBottom: "1px solid var(--bd)",
                      borderRight: "1px solid var(--bd)",
                      padding: "8px 10px",
                      textAlign: "center",
                      minWidth: 110,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{s.label}</span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--fg3)",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {s.query_modifier}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.areas.map((a) => (
                <tr key={a.key}>
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      background: a.starred ? "rgba(234, 179, 8, 0.10)" : "var(--bg2)",
                      borderBottom: "1px solid var(--bd)",
                      borderRight: "1px solid var(--bd)",
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {a.starred && (
                        <span style={{ color: "#eab308", fontSize: 13, lineHeight: 1 }}>★</span>
                      )}
                      <span>{a.label}</span>
                      <span
                        className={`bd-badge ${a.type === "regione" ? "bd-info" : "bd-muted"}`}
                        style={{ fontSize: 9 }}
                      >
                        {a.type === "regione" ? "R" : "C"}
                      </span>
                      <span
                        className="muted"
                        style={{
                          fontSize: 10,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {a.total_agencies}
                      </span>
                    </div>
                  </th>
                  {data.skills.map((s) => {
                    const agencyCount = data.agency_matrix[a.key]?.[s.slug] ?? 0;
                    const serp = data.serp_matrix[a.key]?.[s.slug];
                    const desc = describeCell(serp, agencyCount, data.min_agencies_threshold);
                    const tooltipParts: string[] = [];
                    if (serp) {
                      tooltipParts.push(`Query: ${serp.query}`);
                      if (serp.url) tooltipParts.push(`URL: ${serp.url}`);
                      tooltipParts.push(`Checked: ${formatDate(serp.checked_at)}`);
                    } else if (desc.kind === "below") {
                      tooltipParts.push(`${agencyCount} agenzie (sotto soglia ${data.min_agencies_threshold})`);
                    } else {
                      tooltipParts.push(`${agencyCount} agenzie · non ancora scansionata`);
                    }
                    return (
                      <td
                        key={s.slug}
                        title={tooltipParts.join("\n")}
                        onClick={() =>
                          setSelected({ area: a, skill: s, serp, agencyCount, descriptor: desc })
                        }
                        style={{
                          ...desc.style,
                          borderBottom: "1px solid var(--bd)",
                          borderRight: "1px solid var(--bd)",
                          padding: "8px 10px",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: "ui-monospace, monospace",
                          cursor: "pointer",
                        }}
                      >
                        {desc.text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <SerpCellDialog
          cell={selected}
          minThreshold={data?.min_agencies_threshold ?? 5}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function SerpCellDialog({
  cell,
  minThreshold,
  onClose,
}: {
  cell: SelectedCell;
  minThreshold: number;
  onClose: () => void;
}) {
  const { area, skill, serp, agencyCount, descriptor } = cell;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: "100%",
          background: "var(--bg2)",
          border: "1px solid var(--bd)",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div className="lb">Cella SERP</div>
            <h3 style={{ margin: "4px 0 0" }}>
              {skill.label} × {area.label}
            </h3>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
              {area.type === "regione" ? "Regione" : "Città"} · {area.slug}
            </div>
          </div>
          <button className="btn" onClick={onClose} style={{ fontSize: 11 }}>
            Chiudi
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: "8px 12px",
            fontSize: 13,
          }}
        >
          <div className="muted">Stato</div>
          <div>
            <span
              className="bd-badge"
              style={{
                ...descriptor.style,
                padding: "3px 8px",
                borderRadius: 3,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {descriptor.text}
            </span>
          </div>

          <div className="muted">Agenzie</div>
          <div>
            {agencyCount}
            {agencyCount < minThreshold && (
              <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                (sotto soglia {minThreshold})
              </span>
            )}
          </div>

          {serp ? (
            <>
              <div className="muted">Query</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{serp.query}</div>

              <div className="muted">Posizione</div>
              <div>{serp.position !== null ? `#${serp.position}` : "Fuori top 100"}</div>

              <div className="muted">URL</div>
              <div style={{ wordBreak: "break-all" }}>
                {serp.url ? (
                  <a
                    href={serp.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--accent, #3b82f6)" }}
                  >
                    {serp.url}
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </div>

              <div className="muted">Checked at</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                {formatDate(serp.checked_at)}
              </div>
            </>
          ) : (
            <>
              <div className="muted">Query</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                {skill.query_modifier} {area.label}
              </div>
              <div className="muted">Nota</div>
              <div style={{ fontSize: 12 }}>
                {descriptor.kind === "below"
                  ? `Sotto soglia (${minThreshold} agenzie minime). Non verrà scansionata finché il numero non cresce.`
                  : "Cella eleggibile, ma non ancora scansionata. Attendi il prossimo run dell'agente matrice-serp-position."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
