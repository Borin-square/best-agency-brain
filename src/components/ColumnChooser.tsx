"use client";

import { useEffect, useRef, useState } from "react";

export interface ColumnOption {
  key: string;
  label: string;
  defaultVisible: boolean;
  always?: boolean; // sempre visibile, non toggleable
}

interface Props {
  columns: ColumnOption[];
  value: Set<string>;
  onChange: (visible: Set<string>) => void;
  storageKey?: string; // se passato, persiste il set su localStorage
}

// Carica set da localStorage rispettando le "always" columns.
export function loadColumnsFromStorage(
  storageKey: string,
  columns: ColumnOption[],
): Set<string> {
  const alwaysKeys = columns.filter((c) => c.always).map((c) => c.key);
  const defaults = new Set<string>([
    ...alwaysKeys,
    ...columns.filter((c) => c.defaultVisible).map((c) => c.key),
  ]);
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaults;
    const validKeys = new Set(columns.map((c) => c.key));
    const restored = new Set<string>(
      (parsed as string[]).filter((k) => typeof k === "string" && validKeys.has(k)),
    );
    for (const k of alwaysKeys) restored.add(k);
    return restored;
  } catch {
    return defaults;
  }
}

export default function ColumnChooser({ columns, value, onChange, storageKey }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggle(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col || col.always) return;
    const next = new Set(value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    }
  }

  function resetToDefault() {
    const next = new Set<string>(
      columns.filter((c) => c.always || c.defaultVisible).map((c) => c.key),
    );
    onChange(next);
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    }
  }

  const visibleCount = columns.filter((c) => value.has(c.key)).length;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "7px 12px",
          background: open ? "var(--bg2)" : "var(--bg3)",
          border: `1px solid ${open ? "var(--accent, #3b82f6)" : "var(--bd)"}`,
          borderRadius: 6,
          color: "var(--fg)",
          fontSize: 12,
          fontFamily: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>⚙</span>
        <span>Colonne ({visibleCount})</span>
        <span style={{ fontSize: 10, color: "var(--fg3)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 240,
            maxWidth: 320,
            background: "var(--bg2)",
            border: "1px solid var(--bd)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.32)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
              padding: "6px 0",
            }}
          >
            {columns.map((col) => {
              const checked = value.has(col.key);
              const disabled = col.always === true;
              return (
                <label
                  key={col.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: 12,
                    color: disabled ? "var(--fg3)" : "var(--fg)",
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) e.currentTarget.style.background = "var(--bg3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(col.key)}
                    disabled={disabled}
                    style={{ cursor: disabled ? "not-allowed" : "pointer" }}
                  />
                  <span style={{ flex: 1 }}>{col.label}</span>
                  {disabled && (
                    <span style={{ fontSize: 10, color: "var(--fg3)" }}>fisso</span>
                  )}
                </label>
              );
            })}
          </div>
          <button
            onClick={resetToDefault}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              fontSize: 11,
              color: "var(--fg2)",
              background: "var(--bg3)",
              border: "none",
              borderTop: "1px solid var(--bd)",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            ↺ Ripristina default
          </button>
        </div>
      )}
    </div>
  );
}
