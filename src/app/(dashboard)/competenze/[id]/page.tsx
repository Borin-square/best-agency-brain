"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface FaqItem {
  domanda: string;
  risposta: string;
}

interface GuideItem {
  titolo: string;
  url: string;
}

interface Skill {
  id: string;
  domain_id: string;
  slug: string;
  label: string;
  sort_order: number;
  query_modifier: string;
  descrizione: string | null;
  faq: FaqItem[];
  guide_correlate: GuideItem[];
  created_at: string;
  updated_at: string;
}

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [modifier, setModifier] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [guide, setGuide] = useState<GuideItem[]>([]);

  const [savingBase, setSavingBase] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [savingGuide, setSavingGuide] = useState(false);
  const [baseErr, setBaseErr] = useState<string | null>(null);
  const [faqErr, setFaqErr] = useState<string | null>(null);
  const [guideErr, setGuideErr] = useState<string | null>(null);
  const [baseSaved, setBaseSaved] = useState(false);
  const [faqSaved, setFaqSaved] = useState(false);
  const [guideSaved, setGuideSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/agency-skills/${id}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Skill;
    setSkill(data);
    setLabel(data.label);
    setSlug(data.slug);
    setModifier(data.query_modifier ?? "agenzia");
    setDescrizione(data.descrizione ?? "");
    setFaq(Array.isArray(data.faq) ? data.faq : []);
    setGuide(Array.isArray(data.guide_correlate) ? data.guide_correlate : []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function authHeader(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Sessione non valida");
    return { Authorization: `Bearer ${token}` };
  }

  async function saveBase(e: React.FormEvent) {
    e.preventDefault();
    if (!skill) return;
    setBaseErr(null);
    setSavingBase(true);
    try {
      const h = await authHeader();
      const res = await fetch(`/api/agency-skills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({
          label: label.trim(),
          slug: slug.trim(),
          query_modifier: modifier.trim() || "agenzia",
          descrizione: descrizione.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as Skill;
      setSkill(updated);
      setLabel(updated.label);
      setSlug(updated.slug);
      setModifier(updated.query_modifier ?? "agenzia");
      setDescrizione(updated.descrizione ?? "");
      setBaseSaved(true);
      setTimeout(() => setBaseSaved(false), 2000);
    } catch (e) {
      setBaseErr((e as Error).message);
    } finally {
      setSavingBase(false);
    }
  }

  async function saveFaqList() {
    setFaqErr(null);
    setSavingFaq(true);
    try {
      const h = await authHeader();
      const res = await fetch(`/api/agency-skills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({ faq }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setFaqSaved(true);
      setTimeout(() => setFaqSaved(false), 2000);
    } catch (e) {
      setFaqErr((e as Error).message);
    } finally {
      setSavingFaq(false);
    }
  }

  function addFaq() {
    setFaq((prev) => [...prev, { domanda: "", risposta: "" }]);
  }

  function updateFaq(idx: number, field: keyof FaqItem, value: string) {
    setFaq((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function removeFaq(idx: number) {
    setFaq((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveGuideList() {
    setGuideErr(null);
    setSavingGuide(true);
    try {
      const h = await authHeader();
      const res = await fetch(`/api/agency-skills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({ guide_correlate: guide }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setGuideSaved(true);
      setTimeout(() => setGuideSaved(false), 2000);
    } catch (e) {
      setGuideErr((e as Error).message);
    } finally {
      setSavingGuide(false);
    }
  }

  function addGuide() {
    setGuide((prev) => [...prev, { titolo: "", url: "" }]);
  }

  function updateGuide(idx: number, field: keyof GuideItem, value: string) {
    setGuide((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function removeGuide(idx: number) {
    setGuide((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveGuide(idx: number, dir: -1 | 1) {
    setGuide((prev) => {
      const next = [...prev];
      const swap = next[idx + dir];
      if (!swap) return prev;
      next[idx + dir] = next[idx];
      next[idx] = swap;
      return next;
    });
  }

  function moveFaq(idx: number, dir: -1 | 1) {
    setFaq((prev) => {
      const next = [...prev];
      const swap = next[idx + dir];
      if (!swap) return prev;
      next[idx + dir] = next[idx];
      next[idx] = swap;
      return next;
    });
  }

  if (loading) {
    return (
      <div style={{ padding: 40, color: "var(--fg3)" }}>Caricamento…</div>
    );
  }

  if (notFound || !skill) {
    return (
      <div style={{ padding: 40 }}>
        <p style={{ color: "var(--red)" }}>Competenza non trovata.</p>
        <button className="btn" onClick={() => router.push("/competenze")} style={{ marginTop: 12 }}>
          ← Torna alle competenze
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <button
          className="btn"
          onClick={() => router.push("/competenze")}
          style={{ fontSize: 12, padding: "4px 10px" }}
        >
          ← Competenze
        </button>
        <h1 style={{ margin: 0 }}>{skill.label}</h1>
        <code style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "ui-monospace, monospace" }}>
          {skill.slug}
        </code>
      </div>
      <p className="muted" style={{ marginBottom: 28 }}>
        Modifica i dettagli redazionali. Le modifiche vengono esportate nel CSV competenze per WP All Import.
      </p>

      {/* Campi base */}
      <form onSubmit={saveBase} className="cd" style={{ marginBottom: 20 }}>
        <div className="lb" style={{ marginBottom: 14, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg3)" }}>
          Informazioni base
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div className="lb">Label</div>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <div className="lb">Slug</div>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            />
            <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 4 }}>
              Modificare lo slug aggiorna la tassonomia WP — verificare prima le agenzie associate.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="lb">
            Modificatore{" "}
            <span style={{ fontWeight: 400, color: "var(--fg3)" }}>
              — qualificatore per le query (es. &quot;agenzia&quot;, &quot;studio&quot;)
            </span>
          </div>
          <input
            type="text"
            value={modifier}
            placeholder="agenzia"
            onChange={(e) => setModifier(e.target.value)}
            style={{ ...inputStyle, maxWidth: 220 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="lb">
            Descrizione{" "}
            <span style={{ fontWeight: 400, color: "var(--fg3)" }}>
              — testo per la skill page WP (post_content)
            </span>
          </div>
          <textarea
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            rows={5}
            placeholder={`Descrivi cos'è la competenza "${skill.label}" e perché un'azienda dovrebbe cercare questa specializzazione…`}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 100,
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={savingBase}
          >
            {savingBase ? "Salvataggio…" : "Salva modifiche"}
          </button>
          {baseSaved && (
            <span style={{ color: "var(--green, #22c55e)", fontSize: 13 }}>✓ Salvato</span>
          )}
          {baseErr && (
            <span style={{ color: "var(--red)", fontSize: 13 }}>✗ {baseErr}</span>
          )}
        </div>
      </form>

      {/* Guide correlate */}
      <div className="cd" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div className="lb" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg3)" }}>
              Guide correlate
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Link a guide o approfondimenti utili per questa competenza.
            </div>
          </div>
          <button className="btn" onClick={addGuide} style={{ fontSize: 12 }}>
            + Aggiungi guida
          </button>
        </div>

        {guide.length === 0 ? (
          <p style={{ color: "var(--fg3)", fontSize: 13, marginBottom: 16 }}>
            Nessuna guida correlata. Aggiungine una con il pulsante qui sopra.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {guide.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 8,
                  alignItems: "center",
                  border: "1px solid var(--bd)",
                  borderRadius: 6,
                  padding: "10px 12px",
                  background: "var(--bg3)",
                }}
              >
                <div>
                  <div className="lb" style={{ fontSize: 11, marginBottom: 4 }}>Testo</div>
                  <input
                    type="text"
                    value={item.titolo}
                    onChange={(e) => updateGuide(idx, "titolo", e.target.value)}
                    placeholder="es. Come scegliere un'agenzia SEO"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div className="lb" style={{ fontSize: 11, marginBottom: 4 }}>URL</div>
                  <input
                    type="url"
                    value={item.url}
                    onChange={(e) => updateGuide(idx, "url", e.target.value)}
                    placeholder="https://…"
                    style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 18 }}>
                  <button className="btn" onClick={() => moveGuide(idx, -1)} disabled={idx === 0} style={{ fontSize: 11, padding: "3px 6px" }}>↑</button>
                  <button className="btn" onClick={() => moveGuide(idx, 1)} disabled={idx === guide.length - 1} style={{ fontSize: 11, padding: "3px 6px" }}>↓</button>
                  <button className="btn" onClick={() => removeGuide(idx)} style={{ fontSize: 11, padding: "3px 6px", color: "var(--red)" }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-primary" onClick={saveGuideList} disabled={savingGuide}>
            {savingGuide ? "Salvataggio…" : "Salva guide"}
          </button>
          {guideSaved && <span style={{ color: "var(--green, #22c55e)", fontSize: 13 }}>✓ Salvato</span>}
          {guideErr && <span style={{ color: "var(--red)", fontSize: 13 }}>✗ {guideErr}</span>}
        </div>
      </div>

      {/* FAQ */}
      <div className="cd">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div className="lb" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg3)" }}>
              FAQ
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Domande e risposte per lo schema markup e il blocco FAQ della skill page.
            </div>
          </div>
          <button className="btn" onClick={addFaq} style={{ fontSize: 12 }}>
            + Aggiungi domanda
          </button>
        </div>

        {faq.length === 0 ? (
          <p style={{ color: "var(--fg3)", fontSize: 13, marginBottom: 16 }}>
            Nessuna FAQ. Aggiungine una con il pulsante qui sopra.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
            {faq.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid var(--bd)",
                  borderRadius: 6,
                  padding: 14,
                  background: "var(--bg3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--fg3)", fontWeight: 500 }}>
                    FAQ {idx + 1}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="btn"
                      onClick={() => moveFaq(idx, -1)}
                      disabled={idx === 0}
                      style={{ fontSize: 11, padding: "3px 6px" }}
                    >
                      ↑
                    </button>
                    <button
                      className="btn"
                      onClick={() => moveFaq(idx, 1)}
                      disabled={idx === faq.length - 1}
                      style={{ fontSize: 11, padding: "3px 6px" }}
                    >
                      ↓
                    </button>
                    <button
                      className="btn"
                      onClick={() => removeFaq(idx)}
                      style={{ fontSize: 11, padding: "3px 8px", color: "var(--red)" }}
                    >
                      × Rimuovi
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div className="lb" style={{ fontSize: 11 }}>Domanda</div>
                  <input
                    type="text"
                    value={item.domanda}
                    onChange={(e) => updateFaq(idx, "domanda", e.target.value)}
                    placeholder="es. Cosa fa un'agenzia SEO?"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div className="lb" style={{ fontSize: 11 }}>Risposta</div>
                  <textarea
                    value={item.risposta}
                    onChange={(e) => updateFaq(idx, "risposta", e.target.value)}
                    rows={3}
                    placeholder="Risposta dettagliata…"
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={saveFaqList}
            disabled={savingFaq}
          >
            {savingFaq ? "Salvataggio…" : "Salva FAQ"}
          </button>
          {faqSaved && (
            <span style={{ color: "var(--green, #22c55e)", fontSize: 13 }}>✓ Salvato</span>
          )}
          {faqErr && (
            <span style={{ color: "var(--red)", fontSize: 13 }}>✗ {faqErr}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg2)",
  border: "1px solid var(--bd)",
  color: "var(--fg)",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
};
