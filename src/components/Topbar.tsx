"use client";

import { usePathname } from "next/navigation";
import { MAIN_NAV, FOOTER_NAV } from "@/lib/nav";
import { useDomain, countryFlag } from "./DomainProvider";

export default function Topbar() {
  const pathname = usePathname();
  const all = [...MAIN_NAV, ...FOOTER_NAV];
  const current = all.find(
    (n) => n.href === pathname || (n.href && n.href !== "/" && pathname.startsWith(n.href)),
  );

  const { domains, currentDomainId, setCurrentDomain, loading } = useDomain();

  return (
    <div
      className="topbar"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
    >
      <div className="bc">
        <span className="bc-i">{current?.label ?? "Overview"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="muted" style={{ fontSize: 11 }}>
          Dominio
        </span>
        {loading ? (
          <span className="muted" style={{ fontSize: 12 }}>
            …
          </span>
        ) : domains.length === 0 ? (
          <span className="muted" style={{ fontSize: 12 }}>
            nessuno
          </span>
        ) : (
          <select
            value={currentDomainId ?? ""}
            onChange={(e) => setCurrentDomain(e.target.value)}
            style={{
              padding: "5px 10px",
              background: "var(--bg3)",
              border: "1px solid var(--bd)",
              color: "var(--fg)",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {countryFlag(d.country_code)} {d.domain}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
