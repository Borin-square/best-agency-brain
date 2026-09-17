"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDomain } from "@/components/DomainProvider";

interface Stats {
  total: number;
  verified: number;
  enriched: number;
  cities: number;
  top10: number;
  top20: number;
  serp_checked: number;
}

export default function OverviewPage() {
  const { currentDomainId, currentDomain } = useDomain();
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    if (!currentDomainId) return;
    const res = await fetch(`/api/agencies/stats?domain_id=${currentDomainId}`);
    if (res.ok) setStats(await res.json());
  }, [currentDomainId]);

  useEffect(() => {
    load();
  }, [load]);

  const serpChecked = stats?.serp_checked ?? 0;

  return (
    <div>
      <h1>Overview</h1>
      <p className="muted">
        KPI di {currentDomain?.domain ?? "…"}.
        {serpChecked > 0 && (
          <>
            {" "}
            SERP tracking: {serpChecked} agenzie controllate finora.
          </>
        )}
      </p>

      {/* Riga 1 — anagrafica */}
      <div className="grid-4" style={{ marginTop: 20 }}>
        <KpiCard label="Agenzie totali" value={stats?.total ?? null} />
        <KpiCard label="Verified" value={stats?.verified ?? null} />
        <KpiCard label="Arricchite" value={stats?.enriched ?? null} />
        <KpiCard label="Città uniche" value={stats?.cities ?? null} />
      </div>

      {/* Riga 2 — SERP tracking */}
      <div className="grid-4" style={{ marginTop: 16 }}>
        <KpiCard
          label="Top 10 SERP"
          value={stats?.top10 ?? null}
          highlight={stats && stats.top10 > 0 ? "success" : undefined}
          hint="miglioreagenzia.it in posizione 1-10 per la query nome+città"
          href="/agenzie?serp_max=10"
        />
        <KpiCard
          label="Top 20 SERP"
          value={stats?.top20 ?? null}
          highlight={stats && stats.top20 > 0 ? "info" : undefined}
          hint="miglioreagenzia.it in posizione 1-20"
          href="/agenzie?serp_max=20"
        />
        <KpiCard
          label="SERP controllate"
          value={serpChecked}
          hint="Agenzie con almeno una check SERP registrata"
        />
        <KpiCard
          label="% top 10 su controllate"
          value={
            serpChecked > 0 && stats
              ? `${((stats.top10 / serpChecked) * 100).toFixed(1)}%`
              : null
          }
          hint="Quota di controllate che rankano in top 10"
        />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
  hint,
  href,
}: {
  label: string;
  value: number | string | null;
  highlight?: "success" | "info" | "warn";
  hint?: string;
  href?: string;
}) {
  const color =
    highlight === "success"
      ? "var(--grn)"
      : highlight === "info"
        ? "var(--accent, #3b82f6)"
        : highlight === "warn"
          ? "var(--org, #f59e0b)"
          : "var(--fg)";

  const inner = (
    <>
      <div className="lb">
        {label}
        {href && <span style={{ marginLeft: 6, color: "var(--fg3)", fontSize: 10 }}>→</span>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color }}>
        {value === null || value === undefined ? "—" : value}
      </div>
      {hint && (
        <div className="muted" style={{ fontSize: 10, marginTop: 4, lineHeight: 1.3 }}>
          {hint}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="cd"
        title={hint}
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
          transition: "border-color .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent, #3b82f6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "";
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="cd" title={hint}>
      {inner}
    </div>
  );
}
