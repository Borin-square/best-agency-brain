"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  FIELDS_CATALOG,
  type FieldCategory,
  type FieldDefinition,
  type FieldSource,
  type UpdatePolicy,
} from "@/lib/fields-catalog";

const CATEGORIES: FieldCategory[] = [
  "Identità",
  "Media",
  "Sedi",
  "Mercati",
  "Contatti",
  "Social",
  "Servizi",
  "Clienti & fit",
  "Pricing",
  "Contenuti",
  "Recensioni",
  "Prove",
  "Valutazione",
  "Financial",
  "SEO",
  "Workflow",
  "Commerciale",
  "Enrichment tracking",
  "Sistema",
];

const SOURCES: Array<{ key: FieldSource; label: string }> = [
  { key: "google_places", label: "Google Places" },
  { key: "llm", label: "LLM extract (sito)" },
  { key: "geo_resolver", label: "Geo resolver" },
  { key: "visual_agent", label: "Visual agent" },
  { key: "manual", label: "Manuale" },
  { key: "partner", label: "Partner esterno" },
  { key: "computed", label: "Calcolato" },
  { key: "creation", label: "Alla creazione" },
  { key: "system", label: "Sistema" },
];

const POLICIES: Array<{ key: UpdatePolicy; label: string }> = [
  { key: "always_overwrite", label: "Sempre sovrascritto" },
  { key: "fill_if_empty", label: "Solo se vuoto" },
  { key: "manual_only", label: "Solo manuale" },
  { key: "on_creation", label: "Alla creazione" },
  { key: "computed_per_run", label: "Ricalcolato per run" },
];

const SOURCE_COLOR: Record<FieldSource, string> = {
  google_places: "bd-info",
  llm: "bd-success",
  geo_resolver: "bd-info",
  visual_agent: "bd-warn",
  manual: "bd-muted",
  partner: "bd-warn",
  computed: "bd-info",
  creation: "bd-muted",
  system: "bd-muted",
};

const POLICY_COLOR: Record<UpdatePolicy, string> = {
  always_overwrite: "bd-warn",
  fill_if_empty: "bd-success",
  manual_only: "bd-muted",
  on_creation: "bd-muted",
  computed_per_run: "bd-info",
};

const SOURCE_LABEL_SHORT: Record<FieldSource, string> = {
  google_places: "Google",
  llm: "LLM",
  geo_resolver: "Geo",
  visual_agent: "Visual",
  manual: "Manuale",
  partner: "Partner",
  computed: "Calc",
  creation: "Creazione",
  system: "Sistema",
};

const POLICY_LABEL_SHORT: Record<UpdatePolicy, string> = {
  always_overwrite: "Sempre",
  fill_if_empty: "Se vuoto",
  manual_only: "Manuale",
  on_creation: "Creazione",
  computed_per_run: "Auto",
};

// Colonne DB non semanticamente rilevanti: se mancano nel catalog non alziamo
// warning. Sono id/tracking sistem che possiamo comunque documentare.
const IGNORED_DRIFT_COLUMNS = new Set<string>([]);

export default function FieldsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"" | FieldCategory>("");
  const [source, setSource] = useState<"" | FieldSource>("");
  const [policy, setPolicy] = useState<"" | UpdatePolicy>("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const [dbColumns, setDbColumns] = useState<string[] | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/fields/db-columns")
      .then((r) => r.json())
      .then((d: { columns?: string[]; error?: string }) => {
        if (d.error) setDbError(d.error);
        else setDbColumns(d.columns ?? []);
      })
      .catch((e) => setDbError((e as Error).message));
  }, []);

  const drift = useMemo(() => {
    if (!dbColumns) return null;
    const catalogKeys = new Set(FIELDS_CATALOG.map((f) => f.key));
    const dbSet = new Set(dbColumns);
    const missingInCatalog = dbColumns.filter(
      (c) => !catalogKeys.has(c) && !IGNORED_DRIFT_COLUMNS.has(c),
    );
    const missingInDb = FIELDS_CATALOG.filter((f) => !dbSet.has(f.key)).map((f) => f.key);
    return { missingInCatalog, missingInDb, dbCount: dbColumns.length };
  }, [dbColumns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FIELDS_CATALOG.filter((f) => {
      if (category && f.category !== category) return false;
      if (source && f.source !== source) return false;
      if (policy && f.updatePolicy !== policy) return false;
      if (q) {
        const hay = `${f.key} ${f.label} ${f.description} ${f.csvV1 ?? ""} ${f.csvV2 ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, category, source, policy]);

  const grouped = useMemo(() => {
    const map = new Map<FieldCategory, FieldDefinition[]>();
    for (const f of filtered) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return CATEGORIES.map((c) => ({ category: c, fields: map.get(c) ?? [] })).filter(
      (g) => g.fields.length > 0,
    );
  }, [filtered]);

  const stats = useMemo(() => {
    const total = FIELDS_CATALOG.length;
    const bySource = new Map<FieldSource, number>();
    const byPolicy = new Map<UpdatePolicy, number>();
    for (const f of FIELDS_CATALOG) {
      bySource.set(f.source, (bySource.get(f.source) ?? 0) + 1);
      byPolicy.set(f.updatePolicy, (byPolicy.get(f.updatePolicy) ?? 0) + 1);
    }
    return { total, bySource, byPolicy };
  }, []);

  function resetFilters() {
    setSearch("");
    setCategory("");
    setSource("");
    setPolicy("");
  }

  const activeFilters =
    Number(!!search.trim()) + Number(!!category) + Number(!!source) + Number(!!policy);

  return (
    <div>
      <h1>Fields catalog</h1>
      <p className="muted">
        Documentazione operativa dei campi della tabella <code>agencies</code>: cosa contengono,
        chi li aggiorna, quando vengono sovrascritti.
      </p>

      {/* Drift banner: confronta catalog con colonne reali DB */}
      <DriftBanner drift={drift} error={dbError} loading={dbColumns === null && !dbError} />

      {/* Stats */}
      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Campi totali</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div className="cd">
          <div className="lb">Da LLM (sito)</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats.bySource.get("llm") ?? 0}</div>
        </div>
        <div className="cd">
          <div className="lb">Da Google Places</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats.bySource.get("google_places") ?? 0}</div>
        </div>
        <div className="cd">
          <div className="lb">Solo manuali</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats.byPolicy.get("manual_only") ?? 0}</div>
        </div>
      </div>

      {/* Filtri */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 24,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Cerca (nome, key, descrizione, CSV)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: "1 1 240px", maxWidth: 320 }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as "" | FieldCategory)}
          style={inputStyle}
        >
          <option value="">Categoria (tutte)</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as "" | FieldSource)}
          style={inputStyle}
        >
          <option value="">Aggiornato da (tutti)</option>
          {SOURCES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={policy}
          onChange={(e) => setPolicy(e.target.value as "" | UpdatePolicy)}
          style={inputStyle}
        >
          <option value="">Policy (tutte)</option>
          {POLICIES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        {activeFilters > 0 && (
          <button
            className="btn"
            onClick={resetFilters}
            style={{ fontSize: 11, padding: "6px 10px" }}
          >
            ✕ Reset ({activeFilters})
          </button>
        )}
        <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
          {filtered.length} / {stats.total} campi
        </span>
      </div>

      {/* Tabella per categoria */}
      {grouped.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          Nessun campo matcha i filtri.
        </p>
      ) : (
        grouped.map((g) => (
          <div key={g.category} className="cd" style={{ marginTop: 16, padding: 0 }}>
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
              <h2 style={{ margin: 0, fontSize: 15 }}>{g.category}</h2>
              <span className="muted" style={{ fontSize: 11 }}>
                {g.fields.length} campi
              </span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Campo</th>
                  <th style={{ width: 90 }}>Tipo</th>
                  <th style={{ width: 130 }}>Aggiornato da</th>
                  <th style={{ width: 130 }}>Policy</th>
                  <th>Descrizione</th>
                  <th style={{ width: 100 }}>Visibilità</th>
                </tr>
              </thead>
              <tbody>
                {g.fields.map((f) => {
                  const isExpanded = expandedKey === f.key;
                  return (
                    <Fragment key={f.key}>
                      <tr
                        onClick={() => setExpandedKey(isExpanded ? null : f.key)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <div style={{ fontWeight: 500 }}>{f.label}</div>
                          <code style={{ fontSize: 11, color: "var(--fg3)" }}>{f.key}</code>
                        </td>
                        <td>
                          <code style={{ fontSize: 11, color: "var(--fg2)" }}>{f.type}</code>
                        </td>
                        <td>
                          <span className={`bd-badge ${SOURCE_COLOR[f.source]}`}>
                            {SOURCE_LABEL_SHORT[f.source]}
                          </span>
                        </td>
                        <td>
                          <span className={`bd-badge ${POLICY_COLOR[f.updatePolicy]}`}>
                            {POLICY_LABEL_SHORT[f.updatePolicy]}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>{f.description}</td>
                        <td>
                          <span
                            className={`bd-badge ${f.visibility === "pubblico" ? "bd-success" : f.visibility === "pubblico_opzionale" ? "bd-warn" : "bd-muted"}`}
                            style={{ fontSize: 10 }}
                          >
                            {f.visibility === "pubblico_opzionale" ? "pub. opz" : f.visibility}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              background: "var(--bg2)",
                              padding: "12px 20px",
                              borderTop: "none",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: 14,
                              }}
                            >
                              <ExpandedField label="Se agenzia verificata" value={f.verifiedBehavior} />
                              {f.notes && <ExpandedField label="Note" value={f.notes} />}
                              {f.csvV1 && <ExpandedField label="CSV WP All Import (v1)" value={<code>{f.csvV1}</code>} />}
                              {f.csvV2 && <ExpandedField label="CSV dizionario (v2)" value={<code>{f.csvV2}</code>} />}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}

      <div style={{ marginTop: 20 }} className="muted">
        <details>
          <summary style={{ cursor: "pointer", fontSize: 12 }}>Legenda policy</summary>
          <ul style={{ fontSize: 12, marginTop: 8 }}>
            <li>
              <strong>Sempre sovrascritto</strong>: l&apos;agente scrive il proprio valore ad ogni run,
              anche se il DB ha già un valore. Il flag &quot;verified&quot; attualmente NON blocca la
              sovrascrittura.
            </li>
            <li>
              <strong>Solo se vuoto</strong>: l&apos;agente scrive solo se il DB è null/vuoto/[].
              Curatela manuale già protetta.
            </li>
            <li>
              <strong>Solo manuale</strong>: nessun agente automatico lo tocca.
            </li>
            <li>
              <strong>Alla creazione</strong>: settato all&apos;insert, mai riaggiornato dopo.
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}

function ExpandedField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="lb">{label}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: "var(--fg)" }}>{value}</div>
    </div>
  );
}

function DriftBanner({
  drift,
  error,
  loading,
}: {
  drift: { missingInCatalog: string[]; missingInDb: string[]; dbCount: number } | null;
  error: string | null;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div
        className="cd"
        style={{ marginTop: 12, padding: 10, fontSize: 12, color: "var(--fg3)" }}
      >
        Verifica allineamento catalog ↔ DB…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="cd"
        style={{
          marginTop: 12,
          padding: 10,
          fontSize: 12,
          color: "var(--red)",
          borderColor: "rgba(239,68,68,.4)",
        }}
      >
        Impossibile verificare allineamento DB: {error}
      </div>
    );
  }

  if (!drift) return null;

  const hasIssues = drift.missingInCatalog.length > 0 || drift.missingInDb.length > 0;

  if (!hasIssues) {
    return (
      <div
        className="cd"
        style={{
          marginTop: 12,
          padding: 10,
          fontSize: 12,
          color: "var(--grn)",
          borderColor: "rgba(34,197,94,.4)",
          background: "rgba(34,197,94,.05)",
        }}
      >
        ✓ Catalog allineato con DB — {drift.dbCount} colonne di{" "}
        <code>agencies</code>, {FIELDS_CATALOG.length} nel catalog.
      </div>
    );
  }

  return (
    <div
      className="cd"
      style={{
        marginTop: 12,
        padding: 12,
        fontSize: 12,
        borderColor: drift.missingInDb.length > 0 ? "rgba(239,68,68,.4)" : "rgba(245,158,11,.4)",
        background: drift.missingInDb.length > 0 ? "rgba(239,68,68,.05)" : "rgba(245,158,11,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          {drift.missingInDb.length > 0 && (
            <span style={{ color: "var(--red)", fontWeight: 600, marginRight: 12 }}>
              ⚠ {drift.missingInDb.length} campi nel catalog non esistono più in DB
            </span>
          )}
          {drift.missingInCatalog.length > 0 && (
            <span style={{ color: "#f59e0b", fontWeight: 600 }}>
              ⚠ {drift.missingInCatalog.length} colonne DB non documentate nel catalog
            </span>
          )}
        </div>
        <span style={{ color: "var(--fg3)" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--bd)" }}>
          {drift.missingInDb.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="lb" style={{ color: "var(--red)" }}>
                Nel catalog ma non in DB (rimuovi dal file <code>fields-catalog.ts</code>)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {drift.missingInDb.map((k) => (
                  <code
                    key={k}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      background: "rgba(239,68,68,.1)",
                      borderRadius: 3,
                      color: "var(--red)",
                    }}
                  >
                    {k}
                  </code>
                ))}
              </div>
            </div>
          )}
          {drift.missingInCatalog.length > 0 && (
            <div>
              <div className="lb" style={{ color: "#f59e0b" }}>
                In DB ma non documentate (aggiungi al file <code>fields-catalog.ts</code>)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {drift.missingInCatalog.map((k) => (
                  <code
                    key={k}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      background: "rgba(245,158,11,.1)",
                      borderRadius: 3,
                      color: "#f59e0b",
                    }}
                  >
                    {k}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
