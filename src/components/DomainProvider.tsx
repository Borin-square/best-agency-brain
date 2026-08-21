"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface NetworkDomain {
  id: string;
  domain: string;
  country_code: string;
  country_name: string;
  logo_url: string | null;
  status: "acquistato" | "in_costruzione" | "online" | "fase_1" | "fase_2" | "fase_3";
}

interface DomainCtx {
  domains: NetworkDomain[];
  currentDomainId: string | null;
  currentDomain: NetworkDomain | null;
  setCurrentDomain: (id: string) => void;
  loading: boolean;
  reload: () => Promise<void>;
}

const STORAGE_KEY = "brain:currentDomainId";

const DomainContext = createContext<DomainCtx>({
  domains: [],
  currentDomainId: null,
  currentDomain: null,
  setCurrentDomain: () => {},
  loading: true,
  reload: async () => {},
});

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<NetworkDomain[]>([]);
  const [currentDomainId, setCurrentDomainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/network");
    if (res.ok) {
      const data = (await res.json()) as { rows: NetworkDomain[] };
      setDomains(data.rows);
      // Determina dominio corrente: storage → primo online → primo qualsiasi
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const existing = stored && data.rows.some((d) => d.id === stored);
      if (existing) {
        setCurrentDomainId(stored);
      } else {
        const preferred = data.rows.find((d) => d.status === "online") ?? data.rows[0] ?? null;
        setCurrentDomainId(preferred?.id ?? null);
        if (preferred && typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, preferred.id);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setCurrentDomain = useCallback((id: string) => {
    setCurrentDomainId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  const currentDomain = domains.find((d) => d.id === currentDomainId) ?? null;

  return (
    <DomainContext.Provider
      value={{ domains, currentDomainId, currentDomain, setCurrentDomain, loading, reload: load }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  return useContext(DomainContext);
}

export function countryFlag(cc: string): string {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const chars = cc
    .toUpperCase()
    .split("")
    .map((c) => A + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...chars);
}
