"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { computeAgencyScore, type ScorableAgency } from "@/lib/agency-score";
import { LogoEditor, type LogoMeta } from "@/components/agency/LogoEditor";
import { AgencyEditProvider, Field } from "@/components/agency/EditableField";

interface Agency {
  id: string;
  wp_id: number | null;
  slug: string | null;
  title: string;
  content: string | null;
  competenze_core: string[] | null;
  competenze_principali: string[] | null;
  altre_competenze: string[] | null;
  caratteristiche: string[] | null;
  aree: string | null;
  citta: string | null;
  regioni: string | null;
  status_curatela: string | null;

  descrizione_breve: string | null;
  foto_del_team: string | null;
  sito_web: string | null;
  email: string | null;
  telefono: string | null;
  indirizzo_completo: string | null;
  anno_di_fondazione: number | null;
  dimensione_team: string | null;
  lingue: string[] | null;
  fascia_di_prezzo: string | null;
  partita_iva: string | null;

  pillar_primario_slug: string | null;
  linkedin: string | null;
  instagram: string | null;
  behance: string | null;

  google_rating: number | null;
  google_recensioni_count: number | null;
  match_confidence: number | null;
  google_indirizzo: string | null;
  google_telefono: string | null;
  google_sito: string | null;
  google_categoria: string | null;
  google_foto_url: string | null;
  google_place_id: string | null;

  verifica: string | null;
  title_originale: string | null;
  publish_status: string | null;
  note_curatore: string | null;

  last_enriched_at: string | null;
  enrichment_status: string | null;
  enrichment_errors: Record<string, unknown> | null;
  sources_used: Record<string, unknown> | null;

  logo_url: string | null;
  logo_meta: LogoMeta;
  visual_enrichment_status: string | null;
  visual_enriched_at: string | null;
  photos: Array<{
    public_url: string;
    file_name: string;
    mime_type: string;
    width: number | null;
    height: number | null;
    alt_text: string;
    description: string;
    source_url: string;
    source_page_url: string;
    team_confidence: number;
    uploaded_at: string;
  }> | null;
  portfolio: unknown | null;
  case_studies: unknown | null;
  google_partner_cert: boolean | null;

  // ---- Data dictionary (migration 0012) ----
  parent_slug: string | null;
  alternate_names: string[] | null;
  incorporation_year: number | null;
  legal_form: string | null;
  founder_leader: unknown | null;

  deliverables: string[] | null;
  platforms_tech: string[] | null;
  industries: string[] | null;
  audiences: string[] | null;
  ideal_client_sizes: string[] | null;
  engagement_models: string[] | null;

  min_project_budget: number | null;
  min_project_currency: string | null;
  typical_project_min: number | null;
  typical_project_max: number | null;
  pricing_models: string[] | null;

  differentiators: unknown | null;
  declared_methodology: string | null;
  faq: unknown | null;
  best_for: unknown | null;
  less_suitable_for: unknown | null;

  review_summary: string | null;
  review_strengths: unknown | null;
  review_criticisms: unknown | null;
  review_analyzed_count: number | null;
  review_analysis_confidence: string | null;
  review_snapshot_date: string | null;

  editorial_summary: string | null;
  eval_strengths: unknown | null;
  eval_limitations: unknown | null;
  evidence_grade: string | null;
  evaluation_confidence: string | null;
  human_reviewed: boolean | null;

  revenue_2024: number | null;
  revenue_2025: number | null;
  revenue_2026: number | null;
  employees_2024: number | null;
  employees_2025: number | null;
  employees_2026: number | null;
  ebitda_2024: number | null;
  ebitda_2025: number | null;
  ebitda_2026: number | null;

  seo_title: string | null;
  meta_description: string | null;
  indexation_status: string | null;

  last_verified_at: string | null;
  quality_gate_score: number | null;

  // SERP position tracking
  serp_position: number | null;
  serp_query: string | null;
  serp_url: string | null;
  serp_checked_at: string | null;

  manual_fields: string[] | null;
  domain_id: string | null;

  created_at: string;
  updated_at: string;
}

function ScoreCard({ agency }: { agency: ScorableAgency }) {
  const [expanded, setExpanded] = useState(false);
  const score = computeAgencyScore(agency);
  const color =
    score.total >= 75 ? "var(--grn)" : score.total >= 40 ? "var(--yel, #eab308)" : "var(--red)";
  return (
    <div className="cd" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ minWidth: 120 }}>
          <div className="lb">Completezza</div>
          <div style={{ fontSize: 32, fontWeight: 600, color, lineHeight: 1 }}>
            {score.total}
            <span style={{ fontSize: 14, color: "var(--fg3)", marginLeft: 2 }}>/100</span>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            {score.earnedPoints}/{score.maxPoints} punti
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "var(--bg3)",
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: `${score.total}%`,
                height: "100%",
                background: color,
                transition: "width .3s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {score.breakdown.map((it) => (
              <span
                key={it.key}
                title={`${it.label} · ${it.weight} punti`}
                className={`bd-badge ${it.done ? "bd-success" : "bd-muted"}`}
                style={{ fontSize: 11 }}
              >
                {it.done ? "✓" : "○"} {it.label}
              </span>
            ))}
          </div>
        </div>
        <button
          className="btn"
          onClick={() => setExpanded((v) => !v)}
          style={{ alignSelf: "flex-start", fontSize: 11 }}
        >
          {expanded ? "Chiudi" : "Dettaglio"}
        </button>
      </div>
      {expanded && (
        <table className="tbl" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>Campo</th>
              <th style={{ width: 80 }}>Peso</th>
              <th style={{ width: 80 }}>Stato</th>
              <th style={{ width: 80 }}>Punti</th>
            </tr>
          </thead>
          <tbody>
            {score.breakdown.map((it) => (
              <tr key={it.key}>
                <td>{it.label}</td>
                <td className="muted">{it.weight}</td>
                <td>
                  {it.done ? (
                    <span className="bd-badge bd-success">Ok</span>
                  ) : (
                    <span className="bd-badge bd-muted">Manca</span>
                  )}
                </td>
                <td>{it.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cd" style={{ marginTop: 16 }}>
      <h2 style={{ marginBottom: 14, borderBottom: "1px solid var(--bd)", paddingBottom: 8 }}>
        {title}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>{children}</div>
    </div>
  );
}

export default function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  // Valori già usati, suggeriti negli input dei campi testo "a lista aperta".
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch(`/api/agencies/${id}`).then(async (r) => {
      if (r.ok) setAgency(await r.json());
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!agency?.domain_id) return;
    fetch(`/api/agencies/filter-options?domain_id=${agency.domain_id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setSuggestions({
          verifica: d.verifica ?? [],
          status_curatela: d.status_curatela ?? [],
          regioni: d.regioni ?? [],
          citta: d.citta ?? [],
        });
      })
      .catch(() => {});
  }, [agency?.domain_id]);

  if (loading) return <p className="muted">Caricamento…</p>;
  if (!agency) return <p className="muted">Agenzia non trovata.</p>;

  const arr = (v: string[] | null) =>
    v && v.length > 0 ? (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {v.map((x) => (
          <code
            key={x}
            style={{
              fontSize: 11,
              padding: "2px 8px",
              background: "var(--bg3)",
              borderRadius: 3,
              color: "var(--fg2)",
            }}
          >
            {x}
          </code>
        ))}
      </div>
    ) : null;

  // Solo http(s) diventa link: la fonte di un logo caricato a mano è un testo ("caricato a mano: …").
  const link = (url: string | null) =>
    url && !/^https?:\/\//i.test(url) ? (
      url
    ) : url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
        {url}
      </a>
    ) : null;

  // Renderizza un valore jsonb in modo leggibile.
  // - Array di stringhe → tag list
  // - Array di oggetti {q,a} → domande/risposte
  // - Altrimenti → JSON pretty
  const json = (v: unknown): React.ReactNode => {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) {
      if (v.length === 0) return null;
      if (v.every((x) => typeof x === "string")) return arr(v as string[]);
      // Array di oggetti: mostro come blocchi compatti
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {v.map((item, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--bd)",
                borderRadius: 6,
                padding: 8,
                fontSize: 12,
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "ui-monospace, monospace",
                  color: "var(--fg2)",
                }}
              >
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      );
    }
    if (typeof v === "object") {
      return (
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            color: "var(--fg2)",
            background: "var(--bg3)",
            border: "1px solid var(--bd)",
            borderRadius: 6,
            padding: 8,
          }}
        >
          {JSON.stringify(v, null, 2)}
        </pre>
      );
    }
    return String(v);
  };

  const money = (v: number | null, currency: string | null = "EUR") =>
    v != null ? (
      <span>
        {v.toLocaleString("it-IT")}
        <span className="muted"> {currency ?? "EUR"}</span>
      </span>
    ) : null;

  return (
    <AgencyEditProvider
      value={{
        agency: agency as unknown as Record<string, unknown> & { id: string },
        onSaved: (a) => setAgency(a as unknown as Agency),
        suggestions,
      }}
    >
    <div>
      <Link href="/agenzie" className="muted" style={{ fontSize: 12 }}>
        ← Tutte le agenzie
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginTop: 8,
          gap: 20,
        }}
      >
        <div>
          <h1>{agency.title}</h1>
          <p className="muted">
            {agency.citta}
            {agency.regioni && ` · ${agency.regioni}`}
            {agency.wp_id && ` · WP #${agency.wp_id}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {agency.verifica && (
            <span
              className={`bd-badge ${agency.verifica === "verified" ? "bd-success" : "bd-muted"}`}
            >
              {agency.verifica}
            </span>
          )}
          {agency.match_confidence != null && (
            <span
              className={`bd-badge ${
                agency.match_confidence >= 0.7
                  ? "bd-success"
                  : agency.match_confidence >= 0.4
                    ? "bd-warn"
                    : "bd-error"
              }`}
              title="Match confidence Google Places"
            >
              Match {(agency.match_confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <ScoreCard agency={agency} />

      <Section title="Core">
        <Field label="Title" k="title" value={agency.title} />
        <Field label="Title originale" value={agency.title_originale} />
        <Field label="Slug" value={agency.slug} mono />
        <Field label="Status curatela" k="status_curatela" value={agency.status_curatela} />
        <Field label="Pillar primario" k="pillar_primario_slug" value={agency.pillar_primario_slug} mono />
        <Field label="Publish status" k="publish_status" value={agency.publish_status} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Content" k="content" value={agency.content} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Descrizione breve" k="descrizione_breve" value={agency.descrizione_breve} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Competenze core (max 2)" k="competenze_core" value={arr(agency.competenze_core)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Competenze principali (max 5)" k="competenze_principali" value={arr(agency.competenze_principali)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Altre competenze (max 10)" k="altre_competenze" value={arr(agency.altre_competenze)} />
        </div>
        <Field label="Caratteristiche" k="caratteristiche" value={arr(agency.caratteristiche)} />
        <Field label="Aree" k="aree" value={agency.aree} />
        <Field label="Verifica" k="verifica" value={agency.verifica} />
        <Field label="Città" k="citta" value={agency.citta} mono />
        <Field label="Regione" k="regioni" value={agency.regioni} mono />
        <Field label="Google Partner" k="google_partner_cert" value={agency.google_partner_cert == null ? null : agency.google_partner_cert ? "Sì" : "No"} />
      </Section>

      <Section title="Contatti & sede">
        <Field label="Sito web" k="sito_web" value={link(agency.sito_web)} />
        <Field label="Email" k="email" value={agency.email} />
        <Field label="Telefono" k="telefono" value={agency.telefono} />
        <Field label="Indirizzo completo" k="indirizzo_completo" value={agency.indirizzo_completo} />
        <Field label="Anno di fondazione" k="anno_di_fondazione" value={agency.anno_di_fondazione} />
        <Field label="Dimensione team" k="dimensione_team" value={agency.dimensione_team} />
        <Field label="Lingue" k="lingue" value={arr(agency.lingue)} />
        <Field label="Fascia di prezzo" k="fascia_di_prezzo" value={agency.fascia_di_prezzo} />
        <Field label="Partita IVA" k="partita_iva" value={agency.partita_iva} mono />
      </Section>

      <Section title="Social & media">
        <Field label="LinkedIn" k="linkedin" value={link(agency.linkedin)} />
        <Field label="Instagram" k="instagram" value={link(agency.instagram)} />
        <Field label="Behance" k="behance" value={link(agency.behance)} />
        <Field label="Foto del team (legacy)" value={link(agency.foto_del_team)} />
      </Section>

      <div className="cd" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 14, borderBottom: "1px solid var(--bd)", paddingBottom: 8 }}>
          Visual enrichment
        </h2>

        {/* Logo */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, marginBottom: 20 }}>
          <LogoEditor
            agencyId={agency.id}
            title={agency.title}
            logo={{ logo_url: agency.logo_url, logo_meta: agency.logo_meta }}
            onChange={(logo) => setAgency((a) => (a ? { ...a, ...logo } : a))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="File" value={agency.logo_meta?.file_name} mono />
            <Field
              label="Dimensioni"
              value={
                agency.logo_meta?.width && agency.logo_meta?.height
                  ? `${agency.logo_meta.width}×${agency.logo_meta.height}`
                  : null
              }
            />
            <Field label="MIME" value={agency.logo_meta?.mime_type} mono />
            <Field
              label="Confidence"
              value={agency.logo_meta?.confidence != null ? `${(agency.logo_meta.confidence * 100).toFixed(0)}%` : null}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Fonte originale" value={link(agency.logo_meta?.source_url ?? null)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Alt text" value={agency.logo_meta?.alt_text} />
            </div>
          </div>
        </div>

        {/* Team photos */}
        <div>
          <div className="lb" style={{ marginBottom: 8 }}>
            Foto team {agency.photos?.length ? `(${agency.photos.length})` : ""}
          </div>
          {agency.photos && agency.photos.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {agency.photos.map((p) => (
                <a
                  key={p.public_url}
                  href={p.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    background: "var(--bg3)",
                    border: "1px solid var(--bd)",
                    borderRadius: 6,
                    overflow: "hidden",
                    textDecoration: "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.public_url}
                    alt={p.alt_text}
                    style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: 8, fontSize: 11, color: "var(--fg3)" }}>
                    <div style={{ fontFamily: "ui-monospace, monospace" }}>{p.file_name}</div>
                    <div>
                      {p.width && p.height ? `${p.width}×${p.height}` : "?×?"} · conf{" "}
                      {(p.team_confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--fg3)", fontSize: 13 }}>—</div>
          )}
        </div>

        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--bd)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <Field
            label="Visual enrichment status"
            value={
              agency.visual_enrichment_status ? (
                <span className={`bd-badge bd-${agency.visual_enrichment_status === "success" ? "success" : agency.visual_enrichment_status === "error" ? "error" : "warn"}`}>
                  {agency.visual_enrichment_status}
                </span>
              ) : null
            }
          />
          <Field
            label="Ultima elaborazione visual"
            value={
              agency.visual_enriched_at
                ? new Date(agency.visual_enriched_at).toLocaleString("it-IT")
                : null
            }
          />
        </div>
      </div>

      <Section title="Google Places enrichment">
        <Field
          label="Rating"
          value={
            agency.google_rating != null
              ? `⭐ ${agency.google_rating} (${agency.google_recensioni_count ?? 0} recensioni)`
              : null
          }
        />
        <Field label="Categoria Google" k="google_categoria" value={agency.google_categoria} />
        <Field label="Telefono Google" k="google_telefono" value={agency.google_telefono} />
        <Field label="Sito Google" k="google_sito" value={link(agency.google_sito)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Indirizzo Google" k="google_indirizzo" value={agency.google_indirizzo} />
        </div>
        <Field label="Google Place ID" k="google_place_id" value={agency.google_place_id} mono />
        <Field label="Foto Google" value={agency.google_foto_url} mono />
      </Section>

      {/* ============================================================== */}
      {/* NUOVE SEZIONI — data dictionary (0012_dictionary_additive.sql) */}
      {/* ============================================================== */}

      <Section title="Identità estesa">
        <Field label="Parent slug" k="parent_slug" value={agency.parent_slug} mono />
        <Field label="Legal form" k="legal_form" value={agency.legal_form} />
        <Field label="Incorporation year" k="incorporation_year" value={agency.incorporation_year} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Alternate names" k="alternate_names" value={arr(agency.alternate_names)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Founder / leader" k="founder_leader" value={json(agency.founder_leader)} />
        </div>
      </Section>

      <Section title="Servizi & fit clienti">
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Deliverables" k="deliverables" value={arr(agency.deliverables)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Platforms & tech" k="platforms_tech" value={arr(agency.platforms_tech)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Industries" k="industries" value={arr(agency.industries)} />
        </div>
        <Field label="Audiences" k="audiences" value={arr(agency.audiences)} />
        <Field label="Ideal client sizes" k="ideal_client_sizes" value={arr(agency.ideal_client_sizes)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Engagement models" k="engagement_models" value={arr(agency.engagement_models)} />
        </div>
      </Section>

      <Section title="Pricing strutturato">
        <Field
          label="Budget minimo progetto"
          k="min_project_budget"
          value={money(agency.min_project_budget, agency.min_project_currency)}
        />
        <Field label="Valuta" k="min_project_currency" value={agency.min_project_currency} />
        <Field label="Budget tipico min" k="typical_project_min" value={money(agency.typical_project_min, agency.min_project_currency)} />
        <Field label="Budget tipico max" k="typical_project_max" value={money(agency.typical_project_max, agency.min_project_currency)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Pricing models" k="pricing_models" value={arr(agency.pricing_models)} />
        </div>
      </Section>

      <Section title="Contenuti strutturati">
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Differentiators" k="differentiators" value={json(agency.differentiators)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Declared methodology" k="declared_methodology" value={agency.declared_methodology} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="FAQ" k="faq" value={json(agency.faq)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Best for" k="best_for" value={json(agency.best_for)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Less suitable for" k="less_suitable_for" value={json(agency.less_suitable_for)} />
        </div>
      </Section>

      <Section title="Recensioni AI">
        <Field
          label="Analysis confidence"
          k="review_analysis_confidence"
          value={
            agency.review_analysis_confidence ? (
              <span className="bd-badge bd-muted">{agency.review_analysis_confidence}</span>
            ) : null
          }
        />
        <Field label="Recensioni analizzate" k="review_analyzed_count" value={agency.review_analyzed_count} />
        <Field
          label="Snapshot date"
          k="review_snapshot_date"
          value={
            agency.review_snapshot_date
              ? new Date(agency.review_snapshot_date).toLocaleDateString("it-IT")
              : null
          }
        />
        <div />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Summary" k="review_summary" value={agency.review_summary} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Strengths ricorrenti" k="review_strengths" value={json(agency.review_strengths)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Criticisms ricorrenti" k="review_criticisms" value={json(agency.review_criticisms)} />
        </div>
      </Section>

      <Section title="Valutazione editoriale">
        <Field
          label="Evidence grade"
          k="evidence_grade"
          value={
            agency.evidence_grade ? (
              <span className="bd-badge bd-muted">{agency.evidence_grade}</span>
            ) : null
          }
        />
        <Field
          label="Evaluation confidence"
          k="evaluation_confidence"
          value={
            agency.evaluation_confidence ? (
              <span className="bd-badge bd-muted">{agency.evaluation_confidence}</span>
            ) : null
          }
        />
        <Field
          label="Human reviewed"
          k="human_reviewed"
          value={
            agency.human_reviewed ? (
              <span className="bd-badge bd-success">Sì</span>
            ) : (
              <span className="bd-badge bd-muted">No</span>
            )
          }
        />
        <div />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Editorial summary" k="editorial_summary" value={agency.editorial_summary} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Strengths (con evidenze)" k="eval_strengths" value={json(agency.eval_strengths)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Limitations" k="eval_limitations" value={json(agency.eval_limitations)} />
        </div>
      </Section>

      <Section title="Financial">
        <Field label="Revenue 2024" k="revenue_2024" value={money(agency.revenue_2024, "EUR")} />
        <Field label="Employees 2024" k="employees_2024" value={agency.employees_2024} />
        <Field label="EBITDA 2024" k="ebitda_2024" value={money(agency.ebitda_2024, "EUR")} />
        <div />
        <Field label="Revenue 2025" k="revenue_2025" value={money(agency.revenue_2025, "EUR")} />
        <Field label="Employees 2025" k="employees_2025" value={agency.employees_2025} />
        <Field label="EBITDA 2025" k="ebitda_2025" value={money(agency.ebitda_2025, "EUR")} />
        <div />
        <Field label="Revenue 2026" k="revenue_2026" value={money(agency.revenue_2026, "EUR")} />
        <Field label="Employees 2026" k="employees_2026" value={agency.employees_2026} />
        <Field label="EBITDA 2026" k="ebitda_2026" value={money(agency.ebitda_2026, "EUR")} />
      </Section>

      <Section title="SEO">
        <Field label="SEO title (override)" k="seo_title" value={agency.seo_title} />
        <Field
          label="Indexation status"
          k="indexation_status"
          value={
            agency.indexation_status ? (
              <span
                className={`bd-badge ${
                  agency.indexation_status === "index"
                    ? "bd-success"
                    : agency.indexation_status === "eligible"
                      ? "bd-warn"
                      : "bd-muted"
                }`}
              >
                {agency.indexation_status}
              </span>
            ) : null
          }
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Meta description" k="meta_description" value={agency.meta_description} />
        </div>
      </Section>

      <Section title="SERP tracking">
        <Field
          label="Posizione miglioreagenzia.it"
          value={
            agency.serp_position != null ? (
              <span
                className={`bd-badge ${
                  agency.serp_position <= 10
                    ? "bd-success"
                    : agency.serp_position <= 30
                      ? "bd-warn"
                      : "bd-muted"
                }`}
              >
                #{agency.serp_position}
              </span>
            ) : agency.serp_checked_at ? (
              <span className="bd-badge bd-muted">Fuori top 100</span>
            ) : null
          }
        />
        <Field label="Query usata" value={agency.serp_query} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="URL rankata" value={link(agency.serp_url)} />
        </div>
        <Field
          label="Ultima verifica SERP"
          value={
            agency.serp_checked_at
              ? new Date(agency.serp_checked_at).toLocaleString("it-IT")
              : null
          }
        />
      </Section>

      <Section title="Workflow esteso">
        <Field
          label="Ultima verifica editoriale"
          k="last_verified_at"
          value={
            agency.last_verified_at
              ? new Date(agency.last_verified_at).toLocaleString("it-IT")
              : null
          }
        />
        <Field
          label="Quality gate score"
          value={agency.quality_gate_score != null ? agency.quality_gate_score.toFixed(2) : null}
        />
      </Section>

      <Section title="Enrichment tracking">
        <Field
          label="Ultima esecuzione"
          value={
            agency.last_enriched_at ? new Date(agency.last_enriched_at).toLocaleString("it-IT") : null
          }
        />
        <Field
          label="Enrichment status"
          value={
            agency.enrichment_status ? (
              <span
                className={`bd-badge bd-${
                  agency.enrichment_status === "success"
                    ? "success"
                    : agency.enrichment_status === "error"
                      ? "error"
                      : "warn"
                }`}
              >
                {agency.enrichment_status}
              </span>
            ) : null
          }
        />
        <Field
          label="Sources used"
          value={
            agency.sources_used ? (
              <code style={{ fontSize: 11 }}>{JSON.stringify(agency.sources_used)}</code>
            ) : null
          }
        />
        <Field
          label="Enrichment errors"
          value={
            agency.enrichment_errors ? (
              <code style={{ fontSize: 11, color: "var(--red)" }}>
                {JSON.stringify(agency.enrichment_errors)}
              </code>
            ) : null
          }
        />
        <Field label="Note curatore" k="note_curatore" value={agency.note_curatore} />
        <Field label="Aggiornato" value={new Date(agency.updated_at).toLocaleString("it-IT")} />
      </Section>
    </div>
    </AgencyEditProvider>
  );
}
