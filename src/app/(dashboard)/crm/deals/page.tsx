"use client";

import { useCallback, useEffect, useState } from "react";
import { useDomain } from "@/components/DomainProvider";

interface Deal {
  id: string;
  title: string;
  amount_eur: number | null;
  probability: number | null;
  expected_close_date: string | null;
  stage_id: string | null;
  deal_stages: { name: string; color: string; order_index: number } | null;
  agencies: { title: string } | null;
  contacts: { full_name: string | null; email: string | null } | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

export default function CRMDealsPage() {
  const { currentDomainId, currentDomain } = useDomain();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    const [dealsRes, stagesRes] = await Promise.all([
      fetch(`/api/crm/deals?domain_id=${currentDomainId}`),
      fetch(`/api/crm/deal-stages?domain_id=${currentDomainId}`),
    ]);
    if (dealsRes.ok) setDeals((await dealsRes.json()).rows);
    if (stagesRes.ok) setStages((await stagesRes.json()).rows);
  }, [currentDomainId]);

  useEffect(() => {
    load();
  }, [load]);

  const dealsByStage = new Map<string, Deal[]>();
  for (const s of stages) dealsByStage.set(s.id, []);
  for (const d of deals) {
    if (!d.stage_id) continue;
    if (!dealsByStage.has(d.stage_id)) dealsByStage.set(d.stage_id, []);
    dealsByStage.get(d.stage_id)!.push(d);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Deals</h1>
          <p className="muted">{currentDomain?.domain ?? "…"} · {deals.length} deal totali</p>
        </div>
      </div>

      {stages.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          Nessuna pipeline configurata. La migration 0008 crea gli stage di default.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 12, marginTop: 20 }}>
          {stages.map((s) => {
            const items = dealsByStage.get(s.id) ?? [];
            const value = items.reduce((sum, d) => sum + (d.amount_eur ?? 0), 0);
            return (
              <div key={s.id} className="cd" style={{ padding: 12, minHeight: 300 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg3)" }}>{items.length}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg3)", marginBottom: 10 }}>
                  € {value.toLocaleString("it-IT")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((d) => (
                    <div key={d.id} style={{ padding: 8, background: "var(--bg3)", borderRadius: 4, fontSize: 12 }}>
                      <div style={{ fontWeight: 500 }}>{d.title}</div>
                      {d.agencies && <div className="muted" style={{ fontSize: 11 }}>{d.agencies.title}</div>}
                      {d.amount_eur != null && <div style={{ marginTop: 4, color: "var(--grn)" }}>€ {d.amount_eur.toLocaleString("it-IT")}</div>}
                    </div>
                  ))}
                  {items.length === 0 && <div className="muted" style={{ fontSize: 11 }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
