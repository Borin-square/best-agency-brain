"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MAIN_NAV, FOOTER_NAV } from "@/lib/nav";
import { useAuth } from "./AuthProvider";

const SB_COLL_KEY = "brain:sidebarCollapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SB_COLL_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SB_COLL_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function renderNav(items: typeof MAIN_NAV) {
    return items.map((it) => {
      const active = it.href === pathname || (it.href !== "/" && pathname.startsWith(it.href ?? ""));
      return (
        <Link
          key={it.id}
          href={it.href ?? "#"}
          className={`ni d0${active ? " act" : ""}`}
          title={collapsed ? it.label : undefined}
          style={collapsed ? { justifyContent: "center", padding: "10px 0" } : undefined}
        >
          {it.icon && (
            <span style={{ width: 18, textAlign: "center", fontSize: 14, opacity: 0.8 }}>
              {it.icon}
            </span>
          )}
          {!collapsed && <span>{it.label}</span>}
        </Link>
      );
    });
  }

  return (
    <div id="sidebar" className={`sb${collapsed ? " coll" : ""}`}>
      <div className="sb-head">
        <button
          className="sb-toggle"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Espandi" : "Comprimi"}
        >
          {collapsed ? "☰" : "◀"}
        </button>
        {!collapsed && <span className="sb-logo">BRAIN</span>}
      </div>

      <div className="sb-nav">{renderNav(MAIN_NAV)}</div>

      <div className="sb-foot">
        {renderNav(FOOTER_NAV)}
        {session && !collapsed && (
          <div className="sb-user">
            <div className="sb-user-name">{session.full_name || session.email}</div>
            <div className="sb-user-meta">
              <span className={`sb-user-role ${session.role}`}>{session.role.toUpperCase()}</span>
              <button className="sb-logout" onClick={handleLogout}>
                Esci
              </button>
            </div>
          </div>
        )}
        {session && collapsed && (
          <button
            onClick={handleLogout}
            title="Esci"
            style={{
              width: "100%",
              padding: "10px 0",
              background: "transparent",
              border: "none",
              borderTop: "1px solid var(--bd)",
              color: "var(--fg3)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ⏻
          </button>
        )}
      </div>
    </div>
  );
}
