"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDomain, countryFlag, type NetworkDomain } from "./DomainProvider";

const STATUS_LABELS: Record<NetworkDomain["status"], string> = {
  acquistato: "Acquistato",
  in_costruzione: "In costruzione",
  online: "Online",
  fase_1: "Fase 1",
  fase_2: "Fase 2",
  fase_3: "Fase 3",
};

const STATUS_DOT: Record<NetworkDomain["status"], string> = {
  acquistato: "var(--fg3)",
  in_costruzione: "#eab308",
  online: "var(--grn)",
  fase_1: "#eab308",
  fase_2: "#f97316",
  fase_3: "var(--grn)",
};

export default function DomainSwitcher() {
  const { domains, currentDomain, currentDomainId, setCurrentDomain, loading } = useDomain();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = search.trim()
    ? domains.filter(
        (d) =>
          d.domain.toLowerCase().includes(search.toLowerCase()) ||
          d.country_name.toLowerCase().includes(search.toLowerCase()) ||
          d.country_code.toLowerCase().includes(search.toLowerCase()),
      )
    : domains;

  if (loading) {
    return (
      <div style={triggerStyle}>
        <span className="muted" style={{ fontSize: 12 }}>…</span>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <Link href="/network" style={{ ...triggerStyle, textDecoration: "none" }}>
        <span style={{ fontSize: 16 }}>🌐</span>
        <span style={{ fontSize: 12, color: "var(--fg2)" }}>+ aggiungi dominio</span>
      </Link>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          ...triggerStyle,
          background: open ? "var(--bg2)" : "var(--bg3)",
          borderColor: open ? "var(--accent, #3b82f6)" : "var(--bd)",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>
          {currentDomain ? countryFlag(currentDomain.country_code) : "🌐"}
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>
            {currentDomain?.domain ?? "seleziona"}
          </span>
          {currentDomain && (
            <span style={{ fontSize: 10, color: "var(--fg3)" }}>
              {currentDomain.country_name}
            </span>
          )}
        </div>
        {currentDomain && (
          <span
            title={STATUS_LABELS[currentDomain.status]}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: STATUS_DOT[currentDomain.status],
              marginLeft: 2,
            }}
          />
        )}
        <span style={{ fontSize: 10, color: "var(--fg3)", marginLeft: 4 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 300,
            maxWidth: 380,
            background: "var(--bg2)",
            border: "1px solid var(--bd)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.32)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {domains.length > 5 && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--bd)" }}>
              <input
                autoFocus
                type="text"
                placeholder="Cerca dominio o paese…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  background: "var(--bg3)",
                  border: "1px solid var(--bd)",
                  color: "var(--fg)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              />
            </div>
          )}

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, color: "var(--fg3)", fontSize: 12 }}>
                Nessun risultato.
              </div>
            ) : (
              filtered.map((d) => {
                const active = d.id === currentDomainId;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setCurrentDomain(d.id);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 12px",
                      background: active ? "rgba(59,130,246,.10)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--bd)",
                      color: "var(--fg)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "var(--bg3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{countryFlag(d.country_code)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: active ? 600 : 500,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {d.domain}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 2 }}>
                        {d.country_name} · {d.country_code}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 10,
                        color: "var(--fg3)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: STATUS_DOT[d.status],
                        }}
                      />
                      <span>{STATUS_LABELS[d.status]}</span>
                    </div>
                    {active && (
                      <span style={{ color: "var(--accent, #3b82f6)", fontSize: 14 }}>✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <Link
            href="/network"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "10px 12px",
              fontSize: 12,
              color: "var(--fg2)",
              textDecoration: "none",
              borderTop: "1px solid var(--bd)",
              background: "var(--bg3)",
            }}
          >
            → Gestisci domini
          </Link>
        </div>
      )}
    </div>
  );
}

const triggerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "6px 10px 6px 12px",
  background: "var(--bg3)",
  border: "1px solid var(--bd)",
  borderRadius: 8,
  color: "var(--fg)",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "border-color .15s, background .15s",
};
