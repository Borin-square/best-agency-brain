"use client";

// Campo della scheda agenzia: mostra il valore e, se ha `k` (colonna in EDITABLE_FIELDS), una matita
// per modificarlo in linea. Il salvataggio passa dal PATCH /api/agencies/[id]; i campi salvati a mano
// mostrano un lucchetto (l'agency-updater non li sovrascrive), cliccabile per sbloccarli.

import { createContext, useContext, useState } from "react";
import { apiStaff, inputStyle } from "@/components/content/api";
import { EDITABLE_FIELDS, type EditSpec } from "@/lib/agency-editable";

type Row = Record<string, unknown> & { id: string; manual_fields?: string[] | null };

interface Ctx {
  agency: Row;
  onSaved: (agency: Row) => void;
  suggestions?: Record<string, string[]>;
}

const EditCtx = createContext<Ctx | null>(null);

export function AgencyEditProvider({ value, children }: { value: Ctx; children: React.ReactNode }) {
  return <EditCtx.Provider value={value}>{children}</EditCtx.Provider>;
}

// Valore DB → testo dell'input.
function toInput(spec: EditSpec, v: unknown): string {
  if (v === null || v === undefined) return "";
  switch (spec.type) {
    case "tags":
      return Array.isArray(v) ? v.join(", ") : "";
    case "json":
      return JSON.stringify(v, null, 2);
    case "bool":
      return v ? "true" : "false";
    case "date":
      return String(v).slice(0, 10);
    case "datetime": {
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    default:
      return String(v);
  }
}

// Testo dell'input → valore da mandare all'API (la conversione definitiva la fa il server).
function fromInput(spec: EditSpec, s: string): unknown {
  switch (spec.type) {
    case "tags":
      return s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
    case "json":
      if (!s.trim()) return null;
      try {
        return JSON.parse(s);
      } catch {
        throw new Error("JSON non valido");
      }
    case "bool":
      return s === "" ? null : s === "true";
    case "datetime":
      return s ? new Date(s).toISOString() : null;
    default:
      return s;
  }
}

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "0 2px",
  cursor: "pointer",
  color: "var(--fg3)",
  fontSize: 12,
  lineHeight: 1,
};

export function Field({
  label,
  value,
  mono,
  k,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  k?: string;
}) {
  const ctx = useContext(EditCtx);
  const spec = k ? EDITABLE_FIELDS[k] : undefined;
  const editable = !!(ctx && k && spec);
  const locked = editable && (ctx!.agency.manual_fields ?? []).includes(k!);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty =
    value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

  function start() {
    setDraft(toInput(spec!, ctx!.agency[k!]));
    setError(null);
    setEditing(true);
  }

  async function send(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiStaff<Row>(`/api/agencies/${ctx!.agency.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      ctx!.onSaved(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    let parsed: unknown;
    try {
      parsed = fromInput(spec!, draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    await send({ fields: { [k!]: parsed } });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setEditing(false);
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      void save();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void save();
  }

  const listId = k && ctx?.suggestions?.[k]?.length ? `sugg-${k}` : undefined;

  function input() {
    const common = {
      value: draft,
      autoFocus: true,
      disabled: saving,
      onKeyDown,
      style: { ...inputStyle, fontFamily: mono || spec!.type === "json" ? "ui-monospace, monospace" : "inherit" },
    };
    switch (spec!.type) {
      case "textarea":
      case "json":
        return (
          <textarea
            {...common}
            rows={spec!.type === "json" ? 10 : 6}
            onChange={(e) => setDraft(e.target.value)}
          />
        );
      case "select":
        return (
          <select {...common} onChange={(e) => setDraft(e.target.value)}>
            <option value="">—</option>
            {spec!.options!.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "bool":
        return (
          <select {...common} onChange={(e) => setDraft(e.target.value)}>
            <option value="">—</option>
            <option value="true">Sì</option>
            <option value="false">No</option>
          </select>
        );
      default:
        return (
          <>
            <input
              {...common}
              type={
                spec!.type === "int" || spec!.type === "num"
                  ? "number"
                  : spec!.type === "date"
                    ? "date"
                    : spec!.type === "datetime"
                      ? "datetime-local"
                      : "text"
              }
              step={spec!.type === "num" ? "any" : undefined}
              list={listId}
              onChange={(e) => setDraft(e.target.value)}
            />
            {listId && (
              <datalist id={listId}>
                {ctx!.suggestions![k!].map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            )}
          </>
        );
    }
  }

  return (
    <div>
      <div className="lb" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>{label}</span>
        {locked && (
          <button
            type="button"
            style={iconBtn}
            disabled={saving}
            title="Modificato a mano: gli agenti non lo sovrascrivono. Clicca per sbloccare."
            onClick={() => {
              if (confirm(`Sbloccare "${label}"? L'agente potrà di nuovo aggiornarlo.`)) {
                void send({ unlock: [k] });
              }
            }}
          >
            🔒
          </button>
        )}
        {editable && !editing && (
          <button type="button" style={iconBtn} title="Modifica" onClick={start}>
            ✎
          </button>
        )}
      </div>
      {editing ? (
        <div style={{ marginTop: 4 }}>
          {input()}
          {spec!.type === "tags" && (
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              Separati da virgola{spec!.max ? ` · max ${spec!.max}` : ""}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
            <button type="button" className="btn" disabled={saving} onClick={() => void save()}>
              {saving ? "Salvo…" : "Salva"}
            </button>
            <button type="button" className="btn" disabled={saving} onClick={() => setEditing(false)}>
              Annulla
            </button>
            {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 13,
              color: isEmpty ? "var(--fg3)" : "var(--fg)",
              fontFamily: mono ? "ui-monospace, monospace" : "inherit",
              wordBreak: "break-word",
              whiteSpace: k && spec?.type === "textarea" ? "pre-wrap" : undefined,
              marginTop: 4,
            }}
          >
            {isEmpty ? "—" : value}
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: 12 }}>{error}</div>}
        </>
      )}
    </div>
  );
}
