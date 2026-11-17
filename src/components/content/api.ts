// Chiamate alle API della sezione Contenuti con il token della sessione (le API richiedono lo staff).

import { supabase } from "@/lib/supabase";

export async function apiStaff<T>(percorso: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessione scaduta: rientra nel brain.");
  const multipart = init.body instanceof FormData;
  const res = await fetch(percorso, {
    ...init,
    headers: {
      ...(multipart ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  });
  const dati = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((dati as { error?: string }).error ?? `HTTP ${res.status}`);
  return dati as T;
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg2)",
  border: "1px solid var(--bd)",
  color: "var(--fg)",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
};
