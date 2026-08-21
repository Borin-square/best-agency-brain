"use client";

import { usePathname } from "next/navigation";
import { MAIN_NAV, FOOTER_NAV } from "@/lib/nav";

export default function Topbar() {
  const pathname = usePathname();
  const all = [...MAIN_NAV, ...FOOTER_NAV];
  const current = all.find(
    (n) => n.href === pathname || (n.href && n.href !== "/" && pathname.startsWith(n.href)),
  );
  return (
    <div className="topbar">
      <div className="bc">
        <span className="bc-i">{current?.label ?? "Overview"}</span>
      </div>
    </div>
  );
}
