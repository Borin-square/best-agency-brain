"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NetworkDomain {
  id: string;
  domain: string;
  country_code: string;
  country_name: string;
  logo_url: string | null;
  status:
    | "acquistato"
    | "in_costruzione"
    | "online"
    | "fase_1"
    | "fase_2"
    | "fase_3";
  notes: string | null;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<NetworkDomain["status"], string> = {
  acquistato: "Acquistato",
  in_costruzione: "In costruzione",
  online: "Online",
  fase_1: "Fase 1",
  fase_2: "Fase 2",
  fase_3: "Fase 3",
};

const STATUS_CLASSES: Record<NetworkDomain["status"], string> = {
  acquistato: "bd-muted",
  in_costruzione: "bd-warn",
  online: "bd-success",
  fase_1: "bd-warn",
  fase_2: "bd-warn",
  fase_3: "bd-success",
};

function countryFlag(cc: string): string {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const chars = cc
    .toUpperCase()
    .split("")
    .map((c) => A + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...chars);
}

export default function NetworkPage() {
  const [rows, setRows] = useState<NetworkDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    domain: "",
    country_code: "",
    country_name: "",
    logo_url: "",
    status: "acquistato" as NetworkDomain["status"],
    notes: "",
    launch_date: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/network");
    if (res.ok) {
      const data = (await res.json()) as { rows: NetworkDomain[] };
      setRows(data.rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch("/api/network", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setForm({
        domain: "",
        country_code: "",
        country_name: "",
        logo_url: "",
        status: "acquistato",
        notes: "",
        launch_date: "",
      });
      setShowAdd(false);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: NetworkDomain["status"]) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/network/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string, domain: string) {
    if (!confirm(`Rimuovere ${domain}?`)) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/network/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) await load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div>
          <h1>Network</h1>
          <p className="muted">
            Domini esteri del network miglioreagenzia — {rows.length} attivi.
          </p>
        </div>
        <button className="btn" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? "Chiudi" : "+ Aggiungi dominio"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={submit} className="cd" style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div>
              <div className="lb">Dominio *</div>
              <input
                type="text"
                required
                placeholder="miglioreagenzia.es"
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div className="lb">Codice paese ISO *</div>
              <input
                type="text"
                required
                maxLength={2}
                placeholder="ES"
                value={form.country_code}
                onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value.toUpperCase() }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div className="lb">Nome paese *</div>
              <input
                type="text"
                required
                placeholder="Spagna"
                value={form.country_name}
                onChange={(e) => setForm((f) => ({ ...f, country_name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div className="lb">Logo URL</div>
              <input
                type="url"
                placeholder="https://…"
                value={form.logo_url}
                onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div className="lb">Status</div>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NetworkDomain["status"] }))}
                style={inputStyle}
              >
                {(Object.keys(STATUS_LABELS) as NetworkDomain["status"][]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="lb">Data lancio</div>
              <input
                type="date"
                value={form.launch_date}
                onChange={(e) => setForm((f) => ({ ...f, launch_date: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="lb">Note</div>
              <textarea
                rows={2}
                placeholder="…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
          </div>
          {err && (
            <div style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>
              ✗ {err}
            </div>
          )}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvataggio…" : "Aggiungi"}
            </button>
            <button type="button" className="btn" onClick={() => setShowAdd(false)}>
              Annulla
            </button>
          </div>
        </form>
      )}

      <div className="cd" style={{ marginTop: 20, padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              <th>Paese</th>
              <th>Dominio</th>
              <th>Status</th>
              <th>Lancio</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--fg3)" }}>
                  Caricamento…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--fg3)" }}>
                  Nessun dominio. Clicca &quot;+ Aggiungi dominio&quot;.
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.logo_url}
                        alt={d.domain}
                        style={{ width: 36, height: 36, borderRadius: 4, objectFit: "contain", background: "var(--bg3)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 4,
                          background: "var(--bg3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        {countryFlag(d.country_code)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ marginRight: 8, fontSize: 18 }}>{countryFlag(d.country_code)}</span>
                    <span>{d.country_name}</span>
                    <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>
                      ({d.country_code})
                    </span>
                  </td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
                    {d.domain}
                  </td>
                  <td>
                    <select
                      value={d.status}
                      onChange={(e) => updateStatus(d.id, e.target.value as NetworkDomain["status"])}
                      className={`bd-badge ${STATUS_CLASSES[d.status]}`}
                      style={{
                        border: "1px solid var(--bd)",
                        background: "var(--bg3)",
                        color: "var(--fg)",
                        cursor: "pointer",
                        padding: "3px 8px",
                        fontSize: 11,
                        borderRadius: 3,
                        fontFamily: "inherit",
                      }}
                    >
                      {(Object.keys(STATUS_LABELS) as NetworkDomain["status"][]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {d.launch_date ? new Date(d.launch_date).toLocaleDateString("it-IT") : "—"}
                  </td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => remove(d.id, d.domain)}
                      style={{ fontSize: 11, padding: "4px 8px" }}
                    >
                      Rimuovi
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg3)",
  border: "1px solid var(--bd)",
  color: "var(--fg)",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
};
