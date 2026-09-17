"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MatriceAgenzie from "./matrice-agenzie";
import MatriceSerp from "./matrice-serp";

// Legge query param client-side (evita race con SSR/Suspense).
function readView(): "agenzie" | "serp" {
  if (typeof window === "undefined") return "agenzie";
  const v = new URLSearchParams(window.location.search).get("view");
  return v === "serp" ? "serp" : "agenzie";
}

export default function ListingPage() {
  const [view, setView] = useState<"agenzie" | "serp">(() => readView());

  // Aggiorna quando l'utente naviga tra tab tramite Link Next (query cambia)
  useEffect(() => {
    function sync() {
      setView(readView());
    }
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "1px solid var(--bd)",
        }}
      >
        <TabLink
          href="/listing"
          active={view === "agenzie"}
          label="Agenzie"
          onClick={() => setView("agenzie")}
        />
        <TabLink
          href="/listing?view=serp"
          active={view === "serp"}
          label="Posizione SERP"
          onClick={() => setView("serp")}
        />
      </div>

      {view === "serp" ? <MatriceSerp /> : <MatriceAgenzie />}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  onClick,
}: {
  href: string;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        padding: "10px 18px",
        color: active ? "var(--fg)" : "var(--fg2)",
        textDecoration: "none",
        borderBottom: active
          ? "2px solid var(--accent, #3b82f6)"
          : "2px solid transparent",
        marginBottom: "-1px",
        fontWeight: active ? 600 : 400,
        fontSize: 14,
      }}
    >
      {label}
    </Link>
  );
}
