"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDomain } from "@/components/DomainProvider";

interface AgentMeta {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface Stats {
  total: number;
  verified: number;
  enriched: number;
  cities: number;
}

interface ImportResult {
  ok: boolean;
  parsed?: number;
  mapped?: number;
  imported?: number;
  errors?: number;
  error?: string;
  error_details?: string[];
  debug?: unknown;
}

interface AgencyRow {
  id: string;
  wp_id: number | null;
  title: string;
  citta: string | null;
  regioni: string | null;
  verifica: string | null;
  status_curatela: string | null;
  google_rating: number | null;
  google_recensioni_count: number | null;
  match_confidence: number | null;
  last_enriched_at: string | null;
}

interface ListResponse {
  rows: AgencyRow[];
  total: number;
  page: number;
  pages: number;
}

export default function AgenziePage() {
  const { currentDomainId, currentDomain } = useDomain();

  const [stats, setStats] = useState<Stats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [list, setList] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [regione, setRegione] = useState("");
  const [citta, setCitta] = useState("");
  const [verifica, setVerifica] = useState("");
  const [enriched, setEnriched] = useState<"" | "yes" | "no">("");
  const [enrichmentStatus, setEnrichmentStatus] = useState("");
  const [hasWebsite, setHasWebsite] = useState<"" | "yes" | "no">("");
  const [minRating, setMinRating] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    title: "",
    sito_web: "",
    status_curatela: "proposta",
    publish_status: "draft",
    note_curatore: "",
  });
  const [newErr, setNewErr] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [filterOpts, setFilterOpts] = useState<{
    regioni: string[];
    citta: string[];
    citta_by_regione: Record<string, string[]>;
    verifica: string[];
    enrichment_status: string[];
  }>({ regioni: [], citta: [], citta_by_regione: {}, verifica: [], enrichment_status: [] });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [runAgentId, setRunAgentId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!currentDomainId) return;
    const res = await fetch(`/api/agencies/stats?domain_id=${currentDomainId}`);
    if (res.ok) setStats(await res.json());
  }, [currentDomainId]);

  const loadList = useCallback(async () => {
    if (!currentDomainId) return;
    const params = new URLSearchParams({ page: String(page), domain_id: currentDomainId });
    if (q.trim()) params.set("q", q.trim());
    if (regione) params.set("regione", regione);
    if (citta) params.set("citta", citta);
    if (verifica) params.set("verifica", verifica);
    if (enriched) params.set("enriched", enriched);
    if (enrichmentStatus) params.set("enrichment_status", enrichmentStatus);
    if (hasWebsite) params.set("has_website", hasWebsite);
    if (minRating) params.set("min_rating", minRating);
    const res = await fetch(`/api/agencies?${params}`);
    if (res.ok) setList(await res.json());
  }, [
    page,
    q,
    regione,
    citta,
    verifica,
    enriched,
    enrichmentStatus,
    hasWebsite,
    minRating,
    currentDomainId,
  ]);

  const loadFilterOptions = useCallback(async () => {
    if (!currentDomainId) return;
    const res = await fetch(`/api/agencies/filter-options?domain_id=${currentDomainId}`);
    if (res.ok) setFilterOpts(await res.json());
  }, [currentDomainId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadList();
    setSelected(new Set()); // reset selezione al cambio dominio/filtro/pagina
  }, [loadList]);

  const activeFilters =
    Number(!!q.trim()) +
    Number(!!regione) +
    Number(!!citta) +
    Number(!!verifica) +
    Number(!!enriched) +
    Number(!!enrichmentStatus) +
    Number(!!hasWebsite) +
    Number(!!minRating);

  function resetFilters() {
    setQ("");
    setRegione("");
    setCitta("");
    setVerifica("");
    setEnriched("");
    setEnrichmentStatus("");
    setHasWebsite("");
    setMinRating("");
    setPage(1);
  }

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAgents(d.agents))
      .catch(() => {});
  }, []);

  const loadExportUrl = useCallback(async () => {
    if (!currentDomainId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/agencies/export-url?domain_id=${currentDomainId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      setExportUrl(data.url);
    }
  }, [currentDomainId]);

  useEffect(() => {
    setExportUrl(null); // ricomputa al cambio dominio
  }, [currentDomainId]);

  useEffect(() => {
    if (showUpload && !exportUrl) loadExportUrl();
  }, [showUpload, exportUrl, loadExportUrl]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!list) return;
    const allIds = list.rows.map((r) => r.id);
    const allSelected = allIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function runOnSelected() {
    if (!runAgentId || selected.size === 0) return;
    setRunning(true);
    setRunMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch(`/api/agents/${runAgentId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain_id: currentDomainId,
          agency_ids: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRunMsg(
        `✓ Completato: ${data.rowsSuccess}/${data.rowsProcessed} ok · ${data.rowsError} errori`,
      );
      setSelected(new Set());
      await loadList();
    } catch (e) {
      setRunMsg(`✗ ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  async function copyExportUrl() {
    if (!exportUrl) return;
    await navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentDomainId) {
      setResult({ ok: false, error: "Seleziona prima un dominio dal Topbar" });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("domain_id", currentDomainId);
      const res = await fetch("/api/agencies/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.ok) {
        await loadStats();
        await loadList();
      }
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function createAgency(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDomainId || !newForm.title.trim()) return;
    setCreating(true);
    setNewErr(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ domain_id: currentDomainId, ...newForm }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      // Redirect alla scheda dettaglio della nuova agenzia
      window.location.href = `/agenzie/${j.id}`;
    } catch (err) {
      setNewErr((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <h1>Agenzie</h1>
          <p className="muted">
            {currentDomain?.domain ?? "…"} — {stats?.total ?? "…"} record.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowNew((s) => !s);
              setShowUpload(false);
            }}
          >
            {showNew ? "Chiudi" : "+ Nuova agenzia"}
          </button>
          <button
            className="btn"
            onClick={() => {
              setShowUpload((s) => !s);
              setShowNew(false);
            }}
          >
            {showUpload ? "Chiudi" : "Import / Export CSV"}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Totali</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.total ?? "—"}</div>
        </div>
        <div className="cd">
          <div className="lb">Verified</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.verified ?? "—"}</div>
        </div>
        <div className="cd">
          <div className="lb">Arricchite</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.enriched ?? "—"}</div>
        </div>
        <div className="cd">
          <div className="lb">Città uniche</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{stats?.cities ?? "—"}</div>
        </div>
      </div>

      {/* Nuova agenzia (collassabile) */}
      {showNew && (
        <form onSubmit={createAgency} className="cd" style={{ marginTop: 20 }}>
          <div className="lb" style={{ marginBottom: 10 }}>
            Nuova agenzia · dominio {currentDomain?.domain ?? "…"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <div>
              <div className="lb">Nome agenzia *</div>
              <input
                type="text"
                required
                placeholder="es. Studio Grafico Rossi"
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                style={agencyInputStyle}
              />
            </div>
            <div>
              <div className="lb">Sito web (opz)</div>
              <input
                type="url"
                placeholder="https://…"
                value={newForm.sito_web}
                onChange={(e) => setNewForm((f) => ({ ...f, sito_web: e.target.value }))}
                style={agencyInputStyle}
              />
            </div>
            <div>
              <div className="lb">Status curatela</div>
              <select
                value={newForm.status_curatela}
                onChange={(e) => setNewForm((f) => ({ ...f, status_curatela: e.target.value }))}
                style={agencyInputStyle}
              >
                <option value="proposta">proposta</option>
                <option value="verificata">verificata</option>
                <option value="rifiutata">rifiutata</option>
              </select>
            </div>
            <div>
              <div className="lb">Publish status</div>
              <select
                value={newForm.publish_status}
                onChange={(e) => setNewForm((f) => ({ ...f, publish_status: e.target.value }))}
                style={agencyInputStyle}
              >
                <option value="draft">draft</option>
                <option value="publish">publish</option>
                <option value="pending">pending</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="lb">Note curatore (opz)</div>
              <textarea
                rows={2}
                placeholder="Note interne, contesto, come è stata trovata…"
                value={newForm.note_curatore}
                onChange={(e) => setNewForm((f) => ({ ...f, note_curatore: e.target.value }))}
                style={{ ...agencyInputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
          </div>
          {newErr && (
            <div style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>✗ {newErr}</div>
          )}
          <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!currentDomainId || creating || !newForm.title.trim()}
            >
              {creating ? "Creazione…" : "Crea agenzia"}
            </button>
            <span className="muted" style={{ fontSize: 11 }}>
              Sarai portato alla scheda dettaglio. Poi puoi arricchirla con l&apos;agent updater.
            </span>
          </div>
        </form>
      )}

      {/* Upload (collassabile) */}
      {showUpload && (
        <div className="cd" style={{ marginTop: 20 }}>
          <div className="lb">Export CSV → WP All Import</div>
          <p className="muted" style={{ marginTop: 4, marginBottom: 10 }}>
            URL pubblico da incollare in WP All Import (schedulazione automatica lato WP).
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 20,
              paddingBottom: 20,
              borderBottom: "1px solid var(--bd)",
            }}
          >
            <input
              type="text"
              value={exportUrl ?? "Caricamento…"}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "var(--bg3)",
                border: "1px solid var(--bd)",
                color: "var(--fg2)",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "ui-monospace, monospace",
              }}
            />
            <button
              className="btn"
              onClick={copyExportUrl}
              disabled={!exportUrl}
              style={{ minWidth: 90 }}
            >
              {copied ? "✓ Copiato" : "Copia"}
            </button>
            {exportUrl && (
              <a
                href={exportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ textDecoration: "none" }}
              >
                Apri
              </a>
            )}
          </div>

          <div className="lb">Import CSV WP All Import</div>
          <p className="muted" style={{ marginTop: 4, marginBottom: 14 }}>
            Upload di un CSV con le 37 colonne del template. Upsert su <code>wp_id</code>.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="btn btn-primary"
            style={{ display: "inline-block", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? "Caricamento…" : "Scegli file CSV"}
          </label>
          {result && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 6,
                background: result.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
                border: `1px solid ${result.ok ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"}`,
                fontSize: 13,
              }}
            >
              {result.ok ? (
                <>
                  <div style={{ color: "var(--grn)", fontWeight: 600, marginBottom: 4 }}>✓ Import completato</div>
                  <div className="muted">
                    Parsed: {result.parsed} · Validi: {result.mapped} · Importati: {result.imported} · Errori: {result.errors}
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--red)" }}>✗ {result.error}</div>
              )}
            </div>
          )}
        </div>
      )}

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
          placeholder="Cerca per nome…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, flex: "1 1 220px", maxWidth: 280 }}
        />
        <select
          value={regione}
          onChange={(e) => {
            setRegione(e.target.value);
            setCitta(""); // reset città quando cambia regione
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="">Regione (tutte)</option>
          {filterOpts.regioni.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={citta}
          onChange={(e) => {
            setCitta(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="">Città (tutte)</option>
          {(regione ? filterOpts.citta_by_regione[regione] ?? [] : filterOpts.citta).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={verifica}
          onChange={(e) => {
            setVerifica(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="">Verifica (tutte)</option>
          {filterOpts.verifica.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={enriched}
          onChange={(e) => {
            setEnriched(e.target.value as "" | "yes" | "no");
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="">Arricchite (tutte)</option>
          <option value="yes">Sì</option>
          <option value="no">Mai</option>
        </select>
        <select
          value={enrichmentStatus}
          onChange={(e) => {
            setEnrichmentStatus(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="">Status enrich (tutti)</option>
          {filterOpts.enrichment_status.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={hasWebsite}
          onChange={(e) => {
            setHasWebsite(e.target.value as "" | "yes" | "no");
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="">Sito (indifferente)</option>
          <option value="yes">Con sito</option>
          <option value="no">Senza sito</option>
        </select>
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="">Rating (qualsiasi)</option>
          <option value="3">⭐ 3+</option>
          <option value="4">⭐ 4+</option>
          <option value="4.5">⭐ 4.5+</option>
          <option value="4.8">⭐ 4.8+</option>
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

        {list && (
          <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
            {list.total} risultati · pag {list.page}/{list.pages || 1}
            {selected.size > 0 && <> · <b>{selected.size} selezionate</b></>}
          </span>
        )}
      </div>

      {/* Action bar selezione */}
      {selected.size > 0 && (
        <div
          className="cd"
          style={{
            marginTop: 12,
            padding: 12,
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {selected.size} selezionate · Esegui agent:
          </span>
          <select
            value={runAgentId}
            onChange={(e) => setRunAgentId(e.target.value)}
            style={{
              padding: "6px 10px",
              background: "var(--bg3)",
              border: "1px solid var(--bd)",
              color: "var(--fg)",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            <option value="">— scegli agent —</option>
            {agents.filter((a) => a.enabled).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={runOnSelected}
            disabled={!runAgentId || running}
          >
            {running ? "Esecuzione…" : "Esegui ora"}
          </button>
          <button className="btn" onClick={() => setSelected(new Set())} disabled={running}>
            Annulla selezione
          </button>
          {runMsg && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: runMsg.startsWith("✓") ? "var(--grn)" : "var(--red)",
              }}
            >
              {runMsg}
            </span>
          )}
        </div>
      )}

      {/* Tabella */}
      <div className="cd" style={{ marginTop: 12, padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input
                  type="checkbox"
                  checked={
                    !!list && list.rows.length > 0 && list.rows.every((r) => selected.has(r.id))
                  }
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th>Agenzia</th>
              <th>Città</th>
              <th>Verifica</th>
              <th>Google</th>
              <th>Match</th>
              <th>Arricchita</th>
            </tr>
          </thead>
          <tbody>
            {!list ? (
              <tr>
                <td colSpan={7} style={{ padding: 20, color: "var(--fg3)" }}>
                  Caricamento…
                </td>
              </tr>
            ) : list.rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 20, color: "var(--fg3)" }}>
                  Nessuna agenzia.
                </td>
              </tr>
            ) : (
              list.rows.map((a) => (
                <tr
                  key={a.id}
                  onClick={(e) => {
                    // Non naviga se click è sulla checkbox
                    const target = e.target as HTMLElement;
                    if (target.tagName === "INPUT" || target.closest("input")) return;
                    window.location.href = `/agenzie/${a.id}`;
                  }}
                  style={{
                    cursor: "pointer",
                    background: selected.has(a.id) ? "rgba(59,130,246,.06)" : undefined,
                  }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    {a.wp_id && (
                      <div className="muted" style={{ marginTop: 2, fontSize: 11 }}>
                        #{a.wp_id}
                      </div>
                    )}
                  </td>
                  <td>
                    {a.citta ?? "—"}
                    {a.regioni && <span className="muted"> · {a.regioni}</span>}
                  </td>
                  <td>
                    {a.verifica ? (
                      <span
                        className={`bd-badge ${a.verifica === "verified" ? "bd-success" : "bd-muted"}`}
                      >
                        {a.verifica}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {a.google_rating != null ? (
                      <span>
                        ⭐ {a.google_rating}{" "}
                        <span className="muted">({a.google_recensioni_count ?? 0})</span>
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {a.match_confidence != null ? (
                      <span
                        className={`bd-badge ${
                          a.match_confidence >= 0.7
                            ? "bd-success"
                            : a.match_confidence >= 0.4
                              ? "bd-warn"
                              : "bd-error"
                        }`}
                      >
                        {(a.match_confidence * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="muted">
                    {a.last_enriched_at
                      ? new Date(a.last_enriched_at).toLocaleDateString("it-IT")
                      : "mai"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginazione */}
      {list && list.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prec
          </button>
          <span style={{ padding: "8px 12px", color: "var(--fg2)", fontSize: 13 }}>
            {page} / {list.pages}
          </span>
          <button
            className="btn"
            disabled={page >= list.pages}
            onClick={() => setPage((p) => Math.min(list.pages, p + 1))}
          >
            Succ →
          </button>
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

const agencyInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg3)",
  border: "1px solid var(--bd)",
  color: "var(--fg)",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
};
