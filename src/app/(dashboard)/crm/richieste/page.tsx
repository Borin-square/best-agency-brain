"use client";

// Richieste: gli invii dei form del sito pubblico ("Raccontaci cosa cerchi", "Proponi un'agenzia"),
// del dominio corrente. Prendono il posto di Flamingo sul vecchio WordPress. Le email partono dal
// sito al momento dell'invio; qui si leggono, si cambia lo stato e si annota. Il mittente viene
// censito nei Contatti dal database al momento dell'invio (migrazione 0038).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDomain } from "@/components/DomainProvider";
import { apiStaff, inputStyle } from "@/components/content/api";

type Stato = "nuova" | "in_lavorazione" | "chiusa" | "spam";
type Tipo = "trova" | "proponi";
interface Richiesta {
  id: string;
  tipo: Tipo;
  dati: Record<string, string | string[]>;
  email: string | null;
  pagina: string | null;
  stato: Stato;
  note: string | null;
  email_inviata: boolean | null;
  contact_id: string | null;
  created_at: string;
}

const STATI: Record<Stato, string> = { nuova: "Nuova", in_lavorazione: "In lavorazione", chiusa: "Chiusa", spam: "Spam" };
const TIPI: Record<Tipo, string> = { trova: "Cerca un'agenzia", proponi: "Proponi un'agenzia" };

// Etichette dei campi dei due form (src/lib/moduli.ts del sito), nell'ordine del form.
const CAMPI: Record<Tipo, [string, string][]> = {
  trova: [
    ["nome", "Nome e ruolo"],
    ["email", "Email"],
    ["azienda", "Azienda"],
    ["settore", "Settore"],
    ["tipo_agenzia", "Tipo di agenzia"],
    ["citta", "Città o zona"],
    ["budget", "Budget"],
    ["tempistica", "Tempistica"],
    ["descrizione", "Progetto"],
  ],
  proponi: [
    ["nome_agenzia", "Agenzia"],
    ["sito", "Sito"],
    ["email_agenzia", "Email agenzia"],
    ["telefono", "Telefono"],
    ["citta", "Città"],
    ["servizi", "Servizi"],
    ["settori", "Settori"],
    ["anno", "Anno di fondazione"],
    ["team", "Team"],
    ["lingue", "Lingue"],
    ["case_study", "Case history"],
    ["nome_proponente", "Proposta da"],
    ["email_proponente", "Email di chi propone"],
    ["relazione", "Relazione con l'agenzia"],
    ["note", "Note per la redazione"],
  ],
};

const valore = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? ""));
const quando = (d: string) => new Date(d).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
const titolo = (r: Richiesta) =>
  r.tipo === "trova" ? `${valore(r.dati.azienda) || "—"} · ${valore(r.dati.tipo_agenzia)}` : `${valore(r.dati.nome_agenzia) || "—"} · ${valore(r.dati.citta)}`;

export default function RichiestePage() {
  const { currentDomainId, loading: domainLoading } = useDomain();
  const [righe, setRighe] = useState<Richiesta[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [filtroStato, setFiltroStato] = useState<Stato | "">("");
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "">("");
  const [aperta, setAperta] = useState<string | null>(null);

  const carica = useCallback(async () => {
    if (!currentDomainId) return;
    setCaricamento(true);
    setErrore(null);
    try {
      const q = new URLSearchParams({ domain_id: currentDomainId });
      if (filtroStato) q.set("stato", filtroStato);
      if (filtroTipo) q.set("tipo", filtroTipo);
      const { rows } = await apiStaff<{ rows: Richiesta[] }>(`/api/requests?${q}`);
      setRighe(rows);
    } catch (e) {
      setErrore((e as Error).message);
    }
    setCaricamento(false);
  }, [currentDomainId, filtroStato, filtroTipo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale, come le altre pagine del brain
    if (!domainLoading) carica();
  }, [domainLoading, carica]);

  async function aggiorna(id: string, patch: { stato?: Stato; note?: string }) {
    try {
      const r = await apiStaff<Pick<Richiesta, "id" | "stato" | "note">>(`/api/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setRighe((rr) => rr.map((x) => (x.id === id ? { ...x, ...r } : x)));
    } catch (e) {
      setErrore((e as Error).message);
    }
  }

  const nuove = righe.filter((r) => r.stato === "nuova").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
        <h1>Richieste</h1>
        {!caricamento && <span className="muted">{nuove ? `${nuove} da leggere` : "nessuna nuova"}</span>}
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        Gli invii dei form del sito. Le email alla redazione partono dal sito al momento dell&apos;invio; se non è partita, qui c&apos;è
        l&apos;avviso.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as Tipo | "")} style={{ ...inputStyle, width: 220 }}>
          <option value="">Tutti i form</option>
          {Object.entries(TIPI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value as Stato | "")} style={{ ...inputStyle, width: 180 }}>
          <option value="">Tutti gli stati</option>
          {Object.entries(STATI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {errore && <p style={{ color: "var(--red)", marginBottom: 12 }}>{errore}</p>}
      {caricamento ? (
        <p className="muted">Caricamento…</p>
      ) : !righe.length ? (
        <p className="muted">Nessuna richiesta.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {righe.map((r) => (
            <div key={r.id} className="cd" style={{ padding: 0 }}>
              <button
                type="button"
                onClick={() => setAperta(aperta === r.id ? null : r.id)}
                aria-expanded={aperta === r.id}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "150px 160px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "none",
                  border: 0,
                  color: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: r.stato === "nuova" ? 600 : 400,
                }}
              >
                <span className="muted" style={{ fontSize: 12 }}>
                  {quando(r.created_at)}
                </span>
                <span style={{ fontSize: 12 }}>{TIPI[r.tipo]}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titolo(r)}</span>
                <span style={{ display: "flex", gap: 6, fontSize: 11 }}>
                  {r.email_inviata === false && <span style={{ color: "var(--red)" }}>email non partita</span>}
                  <span className="muted">{STATI[r.stato]}</span>
                </span>
              </button>

              {aperta === r.id && (
                <div style={{ borderTop: "1px solid var(--bd)", padding: 16, display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
                  <dl style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: "6px 12px", margin: 0, fontSize: 13 }}>
                    {CAMPI[r.tipo].map(([k, etichetta]) =>
                      valore(r.dati[k]) ? (
                        <div key={k} style={{ display: "contents" }}>
                          <dt className="muted">{etichetta}</dt>
                          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                            {k === "sito" ? (
                              <a href={valore(r.dati[k])} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                                {valore(r.dati[k])}
                              </a>
                            ) : k.startsWith("email") ? (
                              <a href={`mailto:${valore(r.dati[k])}`} style={{ color: "var(--accent)" }}>
                                {valore(r.dati[k])}
                              </a>
                            ) : (
                              valore(r.dati[k])
                            )}
                          </dd>
                        </div>
                      ) : null,
                    )}
                    <dt className="muted">Contatto CRM</dt>
                    <dd style={{ margin: 0 }}>
                      {r.contact_id && r.email ? (
                        <Link href={`/crm/contacts?q=${encodeURIComponent(r.email)}`} style={{ color: "var(--accent)" }}>
                          Apri nei Contatti
                        </Link>
                      ) : (
                        <span className="muted">non censito</span>
                      )}
                    </dd>
                    {r.pagina && (
                      <>
                        <dt className="muted">Inviata da</dt>
                        <dd style={{ margin: 0 }}>{r.pagina}</dd>
                      </>
                    )}
                  </dl>

                  <div>
                    <div className="lb">Stato</div>
                    <select
                      value={r.stato}
                      onChange={(e) => aggiorna(r.id, { stato: e.target.value as Stato })}
                      style={{ ...inputStyle, marginTop: 4, marginBottom: 12 }}
                    >
                      {Object.entries(STATI).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <div className="lb">Note interne</div>
                    <textarea
                      key={`${r.id}-${r.note ?? ""}`}
                      defaultValue={r.note ?? ""}
                      rows={5}
                      // Si salva quando si esce dal campo.
                      onBlur={(e) => e.target.value !== (r.note ?? "") && aggiorna(r.id, { note: e.target.value })}
                      style={{ ...inputStyle, marginTop: 4, resize: "vertical" }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
