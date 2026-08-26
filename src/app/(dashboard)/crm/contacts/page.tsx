"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDomain } from "@/components/DomainProvider";

interface Contact {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  status: string;
  agencies: { title: string } | null;
  updated_at: string;
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

export default function CRMContactsPage() {
  const { currentDomainId, currentDomain } = useDomain();
  const [rows, setRows] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    linkedin_url: "",
    notes: "",
  });

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    const params = new URLSearchParams({ domain_id: currentDomainId });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/crm/contacts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows);
      setTotal(data.total);
    }
  }, [currentDomainId, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDomainId) return;
    setErr(null);
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessione non valida");
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ domain_id: currentDomainId, ...form }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setForm({ first_name: "", last_name: "", email: "", phone: "", role: "", linkedin_url: "", notes: "" });
      setShowForm(false);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Contatti</h1>
          <p className="muted">{currentDomain?.domain ?? "…"} · {total} contatti</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Chiudi" : "+ Nuovo contatto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="cd" style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><div className="lb">Nome</div><input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} style={inputStyle} /></div>
            <div><div className="lb">Cognome</div><input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} style={inputStyle} /></div>
            <div><div className="lb">Ruolo</div><input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="CEO, Head of Marketing…" style={inputStyle} /></div>
            <div><div className="lb">Email</div><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
            <div><div className="lb">Telefono</div><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
            <div><div className="lb">LinkedIn</div><input type="url" value={form.linkedin_url} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} style={inputStyle} /></div>
            <div style={{ gridColumn: "1 / -1" }}><div className="lb">Note</div><textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} /></div>
          </div>
          {err && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>✗ {err}</div>}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Salvo…" : "Salva"}</button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Annulla</button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input placeholder="Cerca nome/email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, maxWidth: 320 }} />
      </div>

      <div className="cd" style={{ marginTop: 12, padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr><th>Nome</th><th>Email</th><th>Telefono</th><th>Ruolo</th><th>Agenzia</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, color: "var(--fg3)" }}>Nessun contatto.</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id}>
                <td>{c.full_name ?? "—"}</td>
                <td>{c.email ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
                <td className="muted">{c.role ?? "—"}</td>
                <td>{c.agencies?.title ?? "—"}</td>
                <td><span className={`bd-badge ${c.status === "verified" ? "bd-success" : "bd-muted"}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
