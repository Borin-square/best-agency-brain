"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDomain, countryFlag } from "@/components/DomainProvider";

interface Skill {
  id: string;
  domain_id: string;
  slug: string;
  label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function CompetenzePage() {
  const { currentDomain, currentDomainId, loading: domainLoading } = useDomain();
  const [rows, setRows] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    setLoading(true);
    const res = await fetch(`/api/agency-skills?domain_id=${currentDomainId}`);
    if (res.ok) {
      const data = (await res.json()) as { rows: Skill[] };
      setRows(data.rows);
    }
    setLoading(false);
  }, [currentDomainId]);

  useEffect(() => {
    if (!domainLoading) load();
  }, [domainLoading, load]);

  async function authHeader(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Sessione non valida");
    return { Authorization: `Bearer ${token}` };
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDomainId || !newLabel.trim()) return;
    setErr(null);
    setSaving(true);
    try {
      const h = await authHeader();
      const nextOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) + 10 : 10;
      const res = await fetch("/api/agency-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({
          domain_id: currentDomainId,
          label: newLabel.trim(),
          sort_order: nextOrder,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setNewLabel("");
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function renameSkill(id: string, current: string) {
    const label = prompt("Nuovo nome competenza:", current)?.trim();
    if (!label || label === current) return;
    try {
      const h = await authHeader();
      const res = await fetch(`/api/agency-skills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === id);
    const swap = rows[idx + dir];
    if (!swap) return;
    try {
      const h = await authHeader();
      await Promise.all([
        fetch(`/api/agency-skills/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...h },
          body: JSON.stringify({ sort_order: swap.sort_order }),
        }),
        fetch(`/api/agency-skills/${swap.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...h },
          body: JSON.stringify({ sort_order: rows[idx].sort_order }),
        }),
      ]);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Rimuovere "${label}"?\nNota: le agenzie che la usavano manterranno lo slug ma l'agent non la classificherà più.`)) return;
    try {
      const h = await authHeader();
      const res = await fetch(`/api/agency-skills/${id}`, {
        method: "DELETE",
        headers: h,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div>
          <h1>Competenze</h1>
          <p className="muted">
            Lista controllata di competenze per{" "}
            {currentDomain ? (
              <>
                <span style={{ marginRight: 4 }}>{countryFlag(currentDomain.country_code)}</span>
                <strong>{currentDomain.domain}</strong>
              </>
            ) : (
              "il dominio corrente"
            )}
            . L&apos;agent updater può classificare le agenzie usando solo queste voci.
          </p>
        </div>
      </div>

      <form onSubmit={add} className="cd" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div className="lb">Nuova competenza</div>
            <input
              type="text"
              required
              placeholder="es. Motion Design"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              disabled={!currentDomainId || saving}
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!currentDomainId || saving || !newLabel.trim()}
          >
            {saving ? "…" : "+ Aggiungi"}
          </button>
        </div>
        {err && (
          <div style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>✗ {err}</div>
        )}
      </form>

      <div className="cd" style={{ marginTop: 20, padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Label</th>
              <th>Slug</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {domainLoading || loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 20, color: "var(--fg3)" }}>
                  Caricamento…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 20, color: "var(--fg3)" }}>
                  Nessuna competenza per questo dominio. Aggiungine una qui sopra.
                </td>
              </tr>
            ) : (
              rows.map((s, i) => (
                <tr key={s.id}>
                  <td className="muted">{i + 1}</td>
                  <td>{s.label}</td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--fg2)" }}>
                    {s.slug}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button
                        className="btn"
                        title="Sposta su"
                        onClick={() => move(s.id, -1)}
                        disabled={i === 0}
                        style={{ fontSize: 11, padding: "4px 6px" }}
                      >
                        ↑
                      </button>
                      <button
                        className="btn"
                        title="Sposta giù"
                        onClick={() => move(s.id, 1)}
                        disabled={i === rows.length - 1}
                        style={{ fontSize: 11, padding: "4px 6px" }}
                      >
                        ↓
                      </button>
                      <button
                        className="btn"
                        onClick={() => renameSkill(s.id, s.label)}
                        style={{ fontSize: 11, padding: "4px 8px" }}
                      >
                        Rinomina
                      </button>
                      <button
                        className="btn"
                        onClick={() => remove(s.id, s.label)}
                        style={{ fontSize: 11, padding: "4px 8px" }}
                      >
                        ×
                      </button>
                    </div>
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
