"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDomain } from "@/components/DomainProvider";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface PricelistRow {
  area_type: "regione" | "citta";
  area_slug: string;
  area_label: string;
  skill_slug: string;
  skill_label: string;
  query: string;
  position: number | null;
  url: string | null;
  search_volume: number | null;
  cpc: number | null;
  checked_at: string;
  volume_updated_at: string | null;
  ctr: number;
  potential_ctr: number;
  base_price: number | null;
  slot_1: number | null;
  slot_2: number | null;
  slot_3: number | null;
  potential_slot_1: number | null;
}

interface PricingSettings {
  markup: number;
  slot_1_pct: number;
  slot_2_pct: number;
  slot_3_pct: number;
  currency: string;
}

type SortKey =
  | "slot_1"
  | "position"
  | "search_volume"
  | "cpc"
  | "potential_slot_1"
  | "query";

export default function PricelistPage() {
  const { currentDomainId } = useDomain();
  const { session } = useAuth();
  const canEdit = session?.role === "owner" || session?.role === "dev";

  const [rows, setRows] = useState<PricelistRow[]>([]);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("slot_1");
  const [sortDesc, setSortDesc] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [areaTypeFilter, setAreaTypeFilter] = useState<"all" | "regione" | "citta">("all");

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/pricelist?domain_id=${currentDomainId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setRows(json.rows as PricelistRow[]);
      setSettings(json.settings as PricingSettings);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentDomainId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSorted = useMemo(() => {
    let out = rows;
    if (areaTypeFilter !== "all") out = out.filter((r) => r.area_type === areaTypeFilter);
    if (filterQuery.trim()) {
      const q = filterQuery.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.query.toLowerCase().includes(q) ||
          r.skill_label.toLowerCase().includes(q) ||
          r.area_label.toLowerCase().includes(q),
      );
    }
    const dir = sortDesc ? -1 : 1;
    return [...out].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sortKey, sortDesc, filterQuery, areaTypeFilter]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(k);
      setSortDesc(true);
    }
  }

  const currency = settings?.currency ?? "EUR";
  const fmt = (n: number | null) => {
    if (n == null) return "—";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  };
  const fmtInt = (n: number | null) => (n == null ? "—" : n.toLocaleString("it-IT"));
  const fmtCpc = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)} ${currency}`);
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const totals = useMemo(() => {
    const t = { count: filteredSorted.length, slot1: 0, tot3: 0, potSlot1: 0 };
    for (const r of filteredSorted) {
      t.slot1 += r.slot_1 ?? 0;
      t.tot3 += (r.slot_1 ?? 0) + (r.slot_2 ?? 0) + (r.slot_3 ?? 0);
      t.potSlot1 += r.potential_slot_1 ?? 0;
    }
    return t;
  }, [filteredSorted]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Pricelist</h1>
          <p className="muted">
            Prezzi dinamici dei listing: <code>volume × CTR(posizione) × CPC × markup</code>.
            Slot decrescenti (3 featured position vendibili per cella).
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowSettings((v) => !v)}>
          {showSettings ? "Chiudi settings" : "⚙ Settings"}
        </button>
      </div>

      {showSettings && settings && (
        <SettingsPanel
          settings={settings}
          canEdit={canEdit}
          onSaved={(s) => {
            setSettings(s);
            void load();
          }}
        />
      )}

      {/* KPI */}
      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Celle</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{totals.count}</div>
        </div>
        <div className="cd">
          <div className="lb">Ricavo slot 1</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{fmt(totals.slot1)}</div>
        </div>
        <div className="cd">
          <div className="lb">Ricavo 3 slot</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{fmt(totals.tot3)}</div>
        </div>
        <div className="cd">
          <div className="lb">Potenziale slot 1 (tutti pos. 1)</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--grn)" }}>
            {fmt(totals.potSlot1)}
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          className="inp"
          placeholder="Cerca query, skill, area…"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ minWidth: 280 }}
        />
        <select
          className="inp"
          value={areaTypeFilter}
          onChange={(e) => setAreaTypeFilter(e.target.value as "all" | "regione" | "citta")}
        >
          <option value="all">Tutte le aree</option>
          <option value="citta">Città</option>
          <option value="regione">Regione</option>
        </select>
        <span className="muted" style={{ fontSize: 12 }}>
          {filteredSorted.length}/{rows.length} righe
        </span>
      </div>

      {err && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 12 }}>✗ {err}</div>}

      {loading ? (
        <p className="muted" style={{ marginTop: 20 }}>Caricamento…</p>
      ) : rows.length === 0 ? (
        <div className="cd" style={{ marginTop: 20, padding: 20 }}>
          <p className="muted">
            Nessuna cella ancora scansionata. Lancia l&apos;agente <code>matrice-serp-position</code>{" "}
            (Agents → Matrice SERP Position → Esegui) per popolare posizioni + volumi.
          </p>
        </div>
      ) : (
        <div className="cd" style={{ marginTop: 16, padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <Th sortKey="query" label="Query" curr={sortKey} desc={sortDesc} onClick={toggleSort} />
                <th>Skill</th>
                <th>Area</th>
                <Th sortKey="position" label="Pos. MA" curr={sortKey} desc={sortDesc} onClick={toggleSort} />
                <Th sortKey="search_volume" label="Volume" curr={sortKey} desc={sortDesc} onClick={toggleSort} />
                <Th sortKey="cpc" label="CPC" curr={sortKey} desc={sortDesc} onClick={toggleSort} />
                <th>CTR</th>
                <Th sortKey="slot_1" label="Slot 1" curr={sortKey} desc={sortDesc} onClick={toggleSort} />
                <th>Slot 2</th>
                <th>Slot 3</th>
                <Th
                  sortKey="potential_slot_1"
                  label="Pot. slot 1"
                  curr={sortKey}
                  desc={sortDesc}
                  onClick={toggleSort}
                />
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => (
                <tr key={`${r.area_type}|${r.area_slug}|${r.skill_slug}`}>
                  <td style={{ fontWeight: 500 }}>{r.query}</td>
                  <td>
                    <code style={cellCode}>{r.skill_label}</code>
                  </td>
                  <td>
                    <code style={cellCode}>
                      {r.area_label} <span style={{ opacity: 0.5 }}>({r.area_type})</span>
                    </code>
                  </td>
                  <td>
                    {r.position != null ? (
                      <span style={{ fontWeight: 600 }}>#{r.position}</span>
                    ) : (
                      <span className="muted">&gt;100</span>
                    )}
                  </td>
                  <td>{fmtInt(r.search_volume)}</td>
                  <td>{fmtCpc(r.cpc)}</td>
                  <td className="muted">{fmtPct(r.ctr)}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(r.slot_1)}</td>
                  <td className="muted">{fmt(r.slot_2)}</td>
                  <td className="muted">{fmt(r.slot_3)}</td>
                  <td style={{ color: "var(--grn)" }}>{fmt(r.potential_slot_1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cellCode: React.CSSProperties = {
  fontSize: 11,
  padding: "2px 6px",
  background: "var(--bg3)",
  borderRadius: 3,
  color: "var(--fg2)",
};

function Th({
  sortKey,
  label,
  curr,
  desc,
  onClick,
}: {
  sortKey: SortKey;
  label: string;
  curr: SortKey;
  desc: boolean;
  onClick: (k: SortKey) => void;
}) {
  const active = curr === sortKey;
  return (
    <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => onClick(sortKey)}>
      {label} {active ? (desc ? "▾" : "▴") : ""}
    </th>
  );
}

function SettingsPanel({
  settings,
  canEdit,
  onSaved,
}: {
  settings: PricingSettings;
  canEdit: boolean;
  onSaved: (s: PricingSettings) => void;
}) {
  const [markup, setMarkup] = useState(settings.markup);
  const [s1, setS1] = useState(settings.slot_1_pct);
  const [s2, setS2] = useState(settings.slot_2_pct);
  const [s3, setS3] = useState(settings.slot_3_pct);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch("/api/pricelist/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          markup,
          slot_1_pct: s1,
          slot_2_pct: s2,
          slot_3_pct: s3,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      onSaved(json.settings);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cd" style={{ marginTop: 20, padding: 16 }}>
      <div style={{ fontWeight: 500, marginBottom: 12 }}>Pricing settings</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <NumField label="Markup (moltiplicatore)" value={markup} setValue={setMarkup} step={0.1} disabled={!canEdit} />
        <NumField
          label="Slot 1 (frazione)"
          value={s1}
          setValue={setS1}
          step={0.05}
          disabled={!canEdit}
        />
        <NumField
          label="Slot 2 (frazione)"
          value={s2}
          setValue={setS2}
          step={0.05}
          disabled={!canEdit}
        />
        <NumField
          label="Slot 3 (frazione)"
          value={s3}
          setValue={setS3}
          step={0.05}
          disabled={!canEdit}
        />
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={!canEdit || saving}
        >
          {saving ? "Salvo…" : "Salva"}
        </button>
        {!canEdit && (
          <span className="muted" style={{ fontSize: 12 }}>
            Solo Owner/Dev possono modificare.
          </span>
        )}
        {err && <span style={{ color: "var(--red)", fontSize: 12 }}>✗ {err}</span>}
        <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>
          Ricarica la pagina dopo il salvataggio per ricalcolare tutti i prezzi.
        </span>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  setValue,
  step,
  disabled,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  step: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="lb">{label}</div>
      <input
        type="number"
        className="inp"
        value={value}
        step={step}
        min={0}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        disabled={disabled}
        style={{ width: "100%", marginTop: 4 }}
      />
    </div>
  );
}
