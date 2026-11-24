"use client";

// Sezione "Sedi" della scheda agenzia (docs/sedi-progetto.md). Elenco delle sedi con la principale in
// cima; per l'Italia si sceglie il comune dai suggerimenti (provincia e regione le calcola il DB), per
// l'estero si scrive la città. Le sedi italiane decidono in quali archivi di città e regione compare
// l'agenzia sul sito; quelle estere sono solo un dato da mostrare nella scheda.
// API: /api/agencies/[id]/sedi, /api/agencies/[id]/sedi/[sedeId], /api/comuni.

import { useEffect, useRef, useState } from "react";
import { apiStaff, inputStyle } from "@/components/content/api";
import {
  ETICHETTE_FONTE,
  FONTI_SEDE,
  PAESI,
  nomePaese,
  type ComuneTrovato,
  type FonteSede,
  type Sede,
  type TestiGeo,
} from "@/lib/sedi";

type Risposta = { sedi: Sede[]; geo: TestiGeo };

const btnPiccolo: React.CSSProperties = { fontSize: 11, padding: "3px 8px" };

// ---- Campo comune con suggerimenti --------------------------------------------
function ComuneInput({
  domainId,
  valore,
  onScelto,
  autoFocus,
}: {
  domainId: string;
  valore: ComuneTrovato | null;
  onScelto: (c: ComuneTrovato | null) => void;
  autoFocus?: boolean;
}) {
  const [testo, setTesto] = useState(valore ? valore.nome : "");
  const [risultati, setRisultati] = useState<ComuneTrovato[]>([]);
  const [aperto, setAperto] = useState(false);
  const [evidenziato, setEvidenziato] = useState(0);
  const [errore, setErrore] = useState<string | null>(null);
  const richiesta = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Cerca dopo 200 ms di pausa nella digitazione; risponde solo l'ultima richiesta.
  function cerca(testoDigitato: string) {
    const q = testoDigitato.trim();
    if (timer.current) clearTimeout(timer.current);
    const n = ++richiesta.current;
    if (q.length < 2) {
      setRisultati([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const r = await apiStaff<{ comuni: ComuneTrovato[] }>(
          `/api/comuni?domain_id=${encodeURIComponent(domainId)}&q=${encodeURIComponent(q)}`,
        );
        if (n !== richiesta.current) return;
        setRisultati(r.comuni);
        setEvidenziato(0);
        setAperto(true);
        setErrore(null);
      } catch (e) {
        if (n === richiesta.current) setErrore((e as Error).message);
      }
    }, 200);
  }

  function scegli(c: ComuneTrovato) {
    onScelto(c);
    setTesto(c.nome);
    setAperto(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!aperto || risultati.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setEvidenziato((i) => Math.min(i + 1, risultati.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEvidenziato((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      scegli(risultati[evidenziato]);
    } else if (e.key === "Escape") {
      setAperto(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        style={inputStyle}
        value={testo}
        autoFocus={autoFocus}
        placeholder="Scrivi il comune…"
        onChange={(e) => {
          setTesto(e.target.value);
          if (valore) onScelto(null);
          cerca(e.target.value);
        }}
        onFocus={() => risultati.length > 0 && setAperto(true)}
        onBlur={() => setTimeout(() => setAperto(false), 150)}
        onKeyDown={onKeyDown}
      />
      {valore && (
        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
          {valore.nome} ({valore.sigla}) · provincia di {valore.provincia} · {valore.regione}
        </div>
      )}
      {errore && <div style={{ color: "var(--red)", fontSize: 11, marginTop: 2 }}>{errore}</div>}
      {aperto && risultati.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 2,
            background: "var(--bg2)",
            border: "1px solid var(--bd)",
            borderRadius: 6,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow: "0 6px 18px rgba(0,0,0,.25)",
          }}
        >
          {risultati.map((c, i) => (
            <div
              key={c.codice}
              onMouseDown={(e) => {
                e.preventDefault();
                scegli(c);
              }}
              onMouseEnter={() => setEvidenziato(i)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
                background: i === evidenziato ? "var(--bg3)" : "transparent",
              }}
            >
              <strong>{c.nome}</strong>
              {c.nome_altro && <span className="muted"> / {c.nome_altro}</span>}
              <span className="muted">
                {" "}
                · {c.provincia} ({c.sigla}) · {c.regione}
              </span>
            </div>
          ))}
        </div>
      )}
      {aperto && risultati.length === 0 && testo.trim().length >= 2 && !valore && (
        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
          Nessun comune trovato.
        </div>
      )}
    </div>
  );
}

// ---- Modulo di una sede (nuova o in modifica) ---------------------------------
type Bozza = {
  paese: string;
  comune: ComuneTrovato | null;
  citta_estera: string;
  indirizzo: string;
  fonte: FonteSede;
  principale: boolean;
};

function ModuloSede({
  domainId,
  iniziale,
  nuova,
  primaSede,
  salvando,
  onSalva,
  onAnnulla,
}: {
  domainId: string;
  iniziale: Bozza;
  nuova: boolean;
  primaSede: boolean;
  salvando: boolean;
  onSalva: (b: Bozza) => void;
  onAnnulla: () => void;
}) {
  const [b, setB] = useState<Bozza>(iniziale);
  const italia = b.paese === "IT";
  const pronta = italia ? !!b.comune : b.citta_estera.trim().length > 0;

  return (
    <div
      style={{
        border: "1px solid var(--bd)",
        borderRadius: 6,
        padding: 12,
        background: "var(--bg3)",
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 10,
        alignItems: "start",
      }}
    >
      <div className="lb" style={{ paddingTop: 8 }}>Paese</div>
      <div>
        {nuova ? (
          <select
            style={inputStyle}
            value={b.paese}
            disabled={salvando}
            onChange={(e) => setB({ ...b, paese: e.target.value, comune: null, citta_estera: "" })}
          >
            {PAESI.map(([c, n]) => (
              <option key={c} value={c}>
                {n}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ fontSize: 13, paddingTop: 8 }}>{nomePaese(b.paese)}</div>
        )}
      </div>

      <div className="lb" style={{ paddingTop: 8 }}>{italia ? "Comune" : "Città"}</div>
      <div>
        {italia ? (
          <ComuneInput
            domainId={domainId}
            valore={b.comune}
            autoFocus
            onScelto={(c) => setB((x) => ({ ...x, comune: c }))}
          />
        ) : (
          <input
            style={inputStyle}
            value={b.citta_estera}
            autoFocus
            disabled={salvando}
            placeholder="es. Lugano"
            onChange={(e) => setB({ ...b, citta_estera: e.target.value })}
          />
        )}
        {!italia && (
          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
            Le sedi all&apos;estero compaiono nella scheda ma non negli archivi di città e regione.
          </div>
        )}
      </div>

      <div className="lb" style={{ paddingTop: 8 }}>Indirizzo</div>
      <input
        style={inputStyle}
        value={b.indirizzo}
        disabled={salvando}
        placeholder="Via, numero, CAP (facoltativo)"
        onChange={(e) => setB({ ...b, indirizzo: e.target.value })}
      />

      <div className="lb" style={{ paddingTop: 8 }}>Fonte</div>
      <select
        style={inputStyle}
        value={b.fonte}
        disabled={salvando}
        onChange={(e) => setB({ ...b, fonte: e.target.value as FonteSede })}
      >
        {FONTI_SEDE.filter((f) => f !== "migrazione" || b.fonte === "migrazione").map((f) => (
          <option key={f} value={f}>
            {ETICHETTE_FONTE[f]}
          </option>
        ))}
      </select>

      {nuova && !primaSede && (
        <>
          <div />
          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={b.principale}
              disabled={salvando}
              onChange={(e) => setB({ ...b, principale: e.target.checked })}
            />
            Sede principale
          </label>
        </>
      )}

      <div />
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" className="btn" disabled={salvando || !pronta} onClick={() => onSalva(b)}>
          {salvando ? "Salvo…" : nuova ? "Aggiungi sede" : "Salva"}
        </button>
        <button type="button" className="btn" disabled={salvando} onClick={onAnnulla}>
          Annulla
        </button>
      </div>
    </div>
  );
}

// ---- Sezione ------------------------------------------------------------------
export function SediEditor({
  agencyId,
  domainId,
  onGeo,
}: {
  agencyId: string;
  domainId: string;
  onGeo: (geo: TestiGeo) => void;
}) {
  const [sedi, setSedi] = useState<Sede[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [modifica, setModifica] = useState<string | "nuova" | null>(null);

  useEffect(() => {
    let vivo = true;
    apiStaff<Risposta>(`/api/agencies/${agencyId}/sedi`)
      .then((r) => vivo && setSedi(r.sedi))
      .catch((e) => vivo && setErrore((e as Error).message));
    return () => {
      vivo = false;
    };
  }, [agencyId]);

  async function invia(percorso: string, init: RequestInit) {
    setSalvando(true);
    setErrore(null);
    try {
      const r = await apiStaff<Risposta>(percorso, init);
      setSedi(r.sedi);
      onGeo(r.geo);
      setModifica(null);
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const base = `/api/agencies/${agencyId}/sedi`;

  function salvaNuova(b: Bozza) {
    void invia(base, {
      method: "POST",
      body: JSON.stringify({
        paese: b.paese,
        comune_codice: b.comune?.codice,
        citta_estera: b.citta_estera,
        indirizzo: b.indirizzo,
        fonte: b.fonte,
        principale: b.principale,
      }),
    });
  }

  function salvaModifica(s: Sede, b: Bozza) {
    const body: Record<string, unknown> = { indirizzo: b.indirizzo, fonte: b.fonte };
    if (s.paese === "IT") {
      if (b.comune && b.comune.codice !== s.comune_codice) body.comune_codice = b.comune.codice;
    } else {
      body.citta_estera = b.citta_estera;
    }
    void invia(`${base}/${s.id}`, { method: "PATCH", body: JSON.stringify(body) });
  }

  const italiane = (sedi ?? []).filter((s) => s.paese === "IT").length;

  return (
    <div className="cd" style={{ marginTop: 16 }}>
      <h2
        style={{
          marginBottom: 6,
          borderBottom: "1px solid var(--bd)",
          paddingBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Sedi</span>
        {sedi && modifica !== "nuova" && (
          <button type="button" className="btn" style={btnPiccolo} onClick={() => setModifica("nuova")}>
            + Aggiungi sede
          </button>
        )}
      </h2>
      <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        Le sedi in Italia decidono in quali pagine di città e regione compare l&apos;agenzia sul sito, anche
        quelle secondarie. Le sedi all&apos;estero si vedono solo nella scheda.
      </p>

      {errore && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 8 }}>{errore}</div>}
      {!sedi && !errore && <p className="muted">Caricamento…</p>}

      {sedi && sedi.length > 0 && italiane === 0 && (
        <div className="bd-badge bd-warn" style={{ marginBottom: 10, display: "inline-block" }}>
          Nessuna sede in Italia: l&apos;agenzia non compare in nessuna pagina di città o regione.
        </div>
      )}
      {sedi && sedi.length === 0 && modifica !== "nuova" && (
        <p className="muted" style={{ fontSize: 13 }}>
          Nessuna sede. Senza una sede in Italia l&apos;agenzia non compare nelle pagine di città e regione.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(sedi ?? []).map((s) =>
          modifica === s.id ? (
            <ModuloSede
              key={s.id}
              domainId={domainId}
              nuova={false}
              primaSede={false}
              salvando={salvando}
              iniziale={{
                paese: s.paese,
                comune:
                  s.comune_codice && s.comune
                    ? {
                        codice: s.comune_codice,
                        nome: s.comune,
                        nome_altro: null,
                        sigla: s.sigla ?? "",
                        provincia: s.provincia ?? "",
                        regione: s.regione ?? "",
                        capoluogo: false,
                      }
                    : null,
                citta_estera: s.citta_estera ?? "",
                indirizzo: s.indirizzo ?? "",
                fonte: s.fonte ?? "verifica",
                principale: s.principale,
              }}
              onSalva={(b) => salvaModifica(s, b)}
              onAnnulla={() => setModifica(null)}
            />
          ) : (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 10px",
                border: "1px solid var(--bd)",
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 13 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {s.principale && <span className="bd-badge bd-success">Principale</span>}
                  {s.paese === "IT" ? (
                    s.comune ? (
                      <strong>
                        {s.comune} ({s.sigla})
                      </strong>
                    ) : (
                      <strong>Provincia di {s.provincia}</strong>
                    )
                  ) : (
                    <strong>{s.citta_estera}</strong>
                  )}
                  <span className="muted">· {s.paese === "IT" ? s.regione : nomePaese(s.paese)}</span>
                  {s.da_completare && (
                    <span className="bd-badge bd-warn" title="Migrata con la sola provincia: scegli il comune.">
                      da completare
                    </span>
                  )}
                  {s.paese !== "IT" && <span className="bd-badge bd-muted">estero</span>}
                </div>
                {s.indirizzo && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {s.indirizzo}
                  </div>
                )}
                {s.fonte && (
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                    Fonte: {ETICHETTE_FONTE[s.fonte] ?? s.fonte}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-start", flexShrink: 0 }}>
                {!s.principale && (
                  <button
                    type="button"
                    className="btn"
                    style={btnPiccolo}
                    disabled={salvando}
                    onClick={() =>
                      void invia(`${base}/${s.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ principale: true }),
                      })
                    }
                  >
                    Rendi principale
                  </button>
                )}
                <button
                  type="button"
                  className="btn"
                  style={btnPiccolo}
                  disabled={salvando || modifica !== null}
                  onClick={() => setModifica(s.id)}
                >
                  {s.da_completare ? "Scegli comune" : "Modifica"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={btnPiccolo}
                  disabled={salvando}
                  onClick={() => {
                    const dove = s.comune ?? s.citta_estera ?? `provincia di ${s.provincia}`;
                    const ultimaItaliana = s.paese === "IT" && italiane === 1;
                    const avviso = ultimaItaliana
                      ? "\n\nÈ l'ultima sede in Italia: l'agenzia sparirà da tutte le pagine di città e regione."
                      : "";
                    if (confirm(`Eliminare la sede di ${dove}?${avviso}`)) {
                      void invia(`${base}/${s.id}`, { method: "DELETE" });
                    }
                  }}
                >
                  Elimina
                </button>
              </div>
            </div>
          ),
        )}

        {modifica === "nuova" && (
          <ModuloSede
            domainId={domainId}
            nuova
            primaSede={(sedi ?? []).length === 0}
            salvando={salvando}
            iniziale={{
              paese: "IT",
              comune: null,
              citta_estera: "",
              indirizzo: "",
              fonte: "verifica",
              principale: false,
            }}
            onSalva={salvaNuova}
            onAnnulla={() => setModifica(null)}
          />
        )}
      </div>
    </div>
  );
}
