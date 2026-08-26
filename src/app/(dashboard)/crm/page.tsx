"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDomain } from "@/components/DomainProvider";

interface Activity {
  id: string;
  type: string;
  direction: string | null;
  subject: string | null;
  created_at: string;
  contacts: { full_name: string | null; email: string | null } | null;
  deals: { title: string } | null;
}

export default function CRMDashboardPage() {
  const { currentDomainId, currentDomain } = useDomain();
  const [kpi, setKpi] = useState<{
    contacts: number;
    deals_open: number;
    deals_value_open: number;
    deals_won_month: number;
  } | null>(null);
  const [recent, setRecent] = useState<Activity[]>([]);

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    const [contactsRes, dealsRes, actRes] = await Promise.all([
      fetch(`/api/crm/contacts?domain_id=${currentDomainId}&page=1`),
      fetch(`/api/crm/deals?domain_id=${currentDomainId}`),
      fetch(`/api/crm/activities?domain_id=${currentDomainId}&limit=10`),
    ]);
    const contacts = contactsRes.ok ? await contactsRes.json() : { total: 0 };
    const deals = dealsRes.ok ? await dealsRes.json() : { rows: [] };
    const activities = actRes.ok ? await actRes.json() : { rows: [] };

    const openDeals = (deals.rows as Array<{ actual_close_date: string | null; amount_eur: number | null }>).filter(
      (d) => !d.actual_close_date,
    );
    const wonThisMonth = (deals.rows as Array<{ actual_close_date: string | null }>).filter((d) => {
      if (!d.actual_close_date) return false;
      const c = new Date(d.actual_close_date);
      const now = new Date();
      return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear();
    });
    setKpi({
      contacts: contacts.total ?? 0,
      deals_open: openDeals.length,
      deals_value_open: openDeals.reduce((s, d) => s + (d.amount_eur ?? 0), 0),
      deals_won_month: wonThisMonth.length,
    });
    setRecent(activities.rows ?? []);
  }, [currentDomainId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>CRM</h1>
          <p className="muted">{currentDomain?.domain ?? "…"} · Contatti, deal e attività</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/crm/contacts" className="btn">Contatti</Link>
          <Link href="/crm/deals" className="btn btn-primary">Deals</Link>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd"><div className="lb">Contatti</div><div style={{ fontSize: 24, fontWeight: 600 }}>{kpi?.contacts ?? "—"}</div></div>
        <div className="cd"><div className="lb">Deal aperti</div><div style={{ fontSize: 24, fontWeight: 600 }}>{kpi?.deals_open ?? "—"}</div></div>
        <div className="cd"><div className="lb">Pipeline (€)</div><div style={{ fontSize: 24, fontWeight: 600 }}>{kpi != null ? `€ ${kpi.deals_value_open.toLocaleString("it-IT")}` : "—"}</div></div>
        <div className="cd"><div className="lb">Won questo mese</div><div style={{ fontSize: 24, fontWeight: 600, color: "var(--grn)" }}>{kpi?.deals_won_month ?? "—"}</div></div>
      </div>

      <h2 style={{ marginTop: 28 }}>Attività recenti</h2>
      <div className="cd" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr><th>Quando</th><th>Tipo</th><th>Oggetto</th><th>Contatto</th><th>Deal</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 20, color: "var(--fg3)" }}>Nessuna attività ancora.</td></tr>
            ) : (
              recent.map((a) => (
                <tr key={a.id}>
                  <td className="muted" style={{ fontSize: 12 }}>{new Date(a.created_at).toLocaleString("it-IT")}</td>
                  <td><span className="bd-badge bd-muted" style={{ fontSize: 11 }}>{a.type}{a.direction ? ` ${a.direction === "in" ? "↓" : "↑"}` : ""}</span></td>
                  <td>{a.subject ?? "—"}</td>
                  <td>{a.contacts?.full_name ?? a.contacts?.email ?? "—"}</td>
                  <td>{a.deals?.title ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
