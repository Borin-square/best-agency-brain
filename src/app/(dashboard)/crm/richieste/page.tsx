"use client";

// Richieste: gli invii dei form del sito pubblico ("Raccontaci cosa cerchi", "Proponi un'agenzia"),
// del dominio corrente. Prendono il posto di Flamingo sul vecchio WordPress. Le email partono dal
// sito al momento dell'invio; qui si leggono, si cambia lo stato e si annota. Il mittente viene
// censito nei Contatti dal database al momento dell'invio (migrazione 0038).
//
// I due form sono flussi separati, in schede: "Proponi un'agenzia" viene prima ed è aperta di
// default perché le agenzie sono i lead (abbonamenti per verifica e inserimento del profilo).

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
  agency_id: string | null;
  created_at: string;
}

const STATI: Record<Stato, string> = { nuova: "Nuova", in_lavorazione: "In lavorazione", chiusa: "Chiusa", spam: "Spam" };
const TIPI: Record<Tipo, string> = { trova: "Cerca un'agenzia", proponi: "Proponi un'agenzia" };
// Schede in cima alla pagina, nell'ordine in cui compaiono.
const SCHEDE: { id: Tipo | ""; label: string }[] = [
  { id: "proponi", label: "Proponi un'agenzia" },
  { id: "trova", label: "Raccontaci cosa cerchi" },
  { id: "", label: "Tutte" },
];

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

interface Agenzia {
  id: string;
  title: string;
  sito_web: string | null;
  citta: string | null;
  publish_status: string | null;
  status_curatela: string | null;
  motivo?: string;
}

// Riquadro di una proposta: l'agenzia collegata, oppure le candidate trovate tra le agenzie del
// dominio (stesso sito, nome simile) da collegare, oppure la creazione di una bozza dai dati del form.
function AgenziaProposta({ richiesta, onCollegata }: { richiesta: Richiesta; onCollegata: (agencyId: string | null) => void }) {
  const [stato, setStato] = useState<{ collegata: Agenzia | null; candidate: Agenzia[] } | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const percorso = `/api/requests/${richiesta.id}/agenzia`;

  const carica = useCallback(async () => {
    try {
      setStato(await apiStaff<{ collegata: Agenzia | null; candidate: Agenzia[] }>(percorso));
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [percorso]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento all'apertura del dettaglio
    carica();
  }, [carica]);

  async function esegui(init: RequestInit) {
    setOccupato(true);
    setErrore(null);
    try {
      const { collegata } = await apiStaff<{ collegata: Agenzia | null }>(percorso, init);
      onCollegata(collegata?.id ?? null);
      if (collegata) setStato({ collegata, candidate: [] });
      else await carica();
    } catch (e) {
      setErrore((e as Error).message);
    }
    setOccupato(false);
  }

  const descrizione = (a: Agenzia) =>
    [a.citta, a.publish_status === "draft" ? "bozza" : a.publish_status, a.status_curatela].filter(Boolean).join(" · ");

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="lb">Agenzia</div>
      {!stato ? (
        <p className="muted" style={{ fontSize: 12 }}>
          {errore ?? "Ricerca…"}
        </p>
      ) : stato.collegata ? (
        <div style={{ fontSize: 13 }}>
          <Link href={`/agenzie/${stato.collegata.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
            {stato.collegata.title}
          </Link>
          <div className="muted" style={{ fontSize: 12 }}>
            {descrizione(stato.collegata)}
          </div>
          <button type="button" disabled={occupato} onClick={() => esegui({ method: "DELETE" })} style={linkBtn}>
            Scollega
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
          {stato.candidate.length ? (
            stato.candidate.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/agenzie/${a.id}`} target="_blank" style={{ color: "var(--accent)" }}>
                    {a.title}
                  </Link>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {[a.motivo, descrizione(a)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={occupato}
                  onClick={() => esegui({ method: "POST", body: JSON.stringify({ agency_id: a.id }) })}
                  style={linkBtn}
                >
                  Collega
                </button>
              </div>
            ))
          ) : (
            <span className="muted" style={{ fontSize: 12 }}>
              Nessuna agenzia con questo sito o nome.
            </span>
          )}
          <button
            type="button"
            disabled={occupato}
            onClick={() => esegui({ method: "POST", body: JSON.stringify({ crea: true }) })}
            style={{ ...inputStyle, cursor: "pointer", marginTop: 4 }}
          >
            Crea bozza dai dati del form
          </button>
        </div>
      )}
      {stato && errore && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 6 }}>{errore}</p>}
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  background: "none",
  border: 0,
  padding: 0,
  color: "var(--accent)",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
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
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "">("proponi");
  const [aperta, setAperta] = useState<string | null>(null);

  const carica = useCallback(async () => {
    if (!currentDomainId) return;
    setCaricamento(true);
    setErrore(null);
    try {
      const q = new URLSearchParams({ domain_id: currentDomainId });
      const { rows } = await apiStaff<{ rows: Richiesta[] }>(`/api/requests?${q}`);
      setRighe(rows);
    } catch (e) {
      setErrore((e as Error).message);
    }
    setCaricamento(false);
  }, [currentDomainId]);

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

  // Tutte le richieste del dominio si caricano una volta; schede e stato filtrano qui, così ogni
  // scheda mostra quante nuove ha anche quando non è aperta.
  const nuovePer = (tipo: Tipo | "") => righe.filter((r) => r.stato === "nuova" && (!tipo || r.tipo === tipo)).length;
  const visibili = righe.filter((r) => (!filtroTipo || r.tipo === filtroTipo) && (!filtroStato || r.stato === filtroStato));
  const nuove = nuovePer(filtroTipo);

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

      <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--bd)", marginBottom: 16 }}>
        {SCHEDE.map((t) => {
          const attiva = filtroTipo === t.id;
          const n = caricamento ? 0 : nuovePer(t.id);
          return (
            <button
              key={t.id || "tutte"}
              type="button"
              role="tab"
              aria-selected={attiva}
              onClick={() => {
                setFiltroTipo(t.id);
                setAperta(null);
              }}
              style={{
                padding: "8px 14px",
                marginBottom: -1,
                background: "none",
                border: 0,
                borderBottom: `2px solid ${attiva ? "var(--accent)" : "transparent"}`,
                color: attiva ? "var(--fg)" : "var(--fg2)",
                fontWeight: attiva ? 600 : 400,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {t.label}
              {n > 0 && (
                <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 10, background: "var(--accent)", color: "#fff", fontSize: 11 }}>
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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
      ) : !visibili.length ? (
        <p className="muted">Nessuna richiesta.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {visibili.map((r) => (
            <div key={r.id} className="cd" style={{ padding: 0 }}>
              <button
                type="button"
                onClick={() => setAperta(aperta === r.id ? null : r.id)}
                aria-expanded={aperta === r.id}
                style={{
                  width: "100%",
                  display: "grid",
                  // La colonna del form serve solo nella scheda "Tutte".
                  gridTemplateColumns: filtroTipo ? "150px 1fr auto" : "150px 160px 1fr auto",
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
                {!filtroTipo && <span style={{ fontSize: 12 }}>{TIPI[r.tipo]}</span>}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titolo(r)}</span>
                <span style={{ display: "flex", gap: 6, fontSize: 11 }}>
                  {r.email_inviata === false && <span style={{ color: "var(--red)" }}>email non partita</span>}
                  {r.tipo === "proponi" && !r.agency_id && r.stato !== "spam" && <span style={{ color: "var(--accent)" }}>da collegare</span>}
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
                    {r.tipo === "proponi" && (
                      <AgenziaProposta
                        richiesta={r}
                        onCollegata={(agencyId) => setRighe((rr) => rr.map((x) => (x.id === r.id ? { ...x, agency_id: agencyId } : x)))}
                      />
                    )}
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
