"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { computeAgencyScore, type ScorableAgency } from "@/lib/agency-score";

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
  logo_meta: {
    file_name?: string;
    mime_type?: string;
    width?: number | null;
    height?: number | null;
    alt_text?: string;
    description?: string;
    source_url?: string;
    confidence?: number;
    updated_at?: string;
  } | null;
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

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  const isEmpty =
    value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  return (
    <div>
      <div className="lb">{label}</div>
      <div
        style={{
          fontSize: 13,
          color: isEmpty ? "var(--fg3)" : "var(--fg)",
          fontFamily: mono ? "ui-monospace, monospace" : "inherit",
          wordBreak: "break-word",
          marginTop: 4,
        }}
      >
        {isEmpty ? "—" : value}
      </div>
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

  useEffect(() => {
    fetch(`/api/agencies/${id}`).then(async (r) => {
      if (r.ok) setAgency(await r.json());
      setLoading(false);
    });
  }, [id]);

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

  const link = (url: string | null) =>
    url ? (
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
        <Field label="Title" value={agency.title} />
        <Field label="Title originale" value={agency.title_originale} />
        <Field label="Slug" value={agency.slug} mono />
        <Field label="Status curatela" value={agency.status_curatela} />
        <Field label="Pillar primario" value={agency.pillar_primario_slug} mono />
        <Field label="Publish status" value={agency.publish_status} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Content" value={agency.content} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Descrizione breve" value={agency.descrizione_breve} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Competenze core (max 2)" value={arr(agency.competenze_core)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Competenze principali (max 5)" value={arr(agency.competenze_principali)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Altre competenze (max 10)" value={arr(agency.altre_competenze)} />
        </div>
        <Field label="Caratteristiche" value={arr(agency.caratteristiche)} />
        <Field label="Aree" value={agency.aree} />
      </Section>

      <Section title="Contatti & sede">
        <Field label="Sito web" value={link(agency.sito_web)} />
        <Field label="Email" value={agency.email} />
        <Field label="Telefono" value={agency.telefono} />
        <Field label="Indirizzo completo" value={agency.indirizzo_completo} />
        <Field label="Anno di fondazione" value={agency.anno_di_fondazione} />
        <Field label="Dimensione team" value={agency.dimensione_team} />
        <Field label="Lingue" value={arr(agency.lingue)} />
        <Field label="Fascia di prezzo" value={agency.fascia_di_prezzo} />
        <Field label="Partita IVA" value={agency.partita_iva} mono />
      </Section>

      <Section title="Social & media">
        <Field label="LinkedIn" value={link(agency.linkedin)} />
        <Field label="Instagram" value={link(agency.instagram)} />
        <Field label="Behance" value={link(agency.behance)} />
        <Field label="Foto del team (legacy)" value={link(agency.foto_del_team)} />
      </Section>

      <div className="cd" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 14, borderBottom: "1px solid var(--bd)", paddingBottom: 8 }}>
          Visual enrichment
        </h2>

        {/* Logo */}
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <div className="lb">Logo</div>
            {agency.logo_url ? (
              <div
                style={{
                  marginTop: 6,
                  padding: 10,
                  background: "var(--bg3)",
                  borderRadius: 6,
                  border: "1px solid var(--bd)",
                  minHeight: 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={agency.logo_url}
                  alt={agency.logo_meta?.alt_text ?? `Logo di ${agency.title}`}
                  style={{ maxWidth: "100%", maxHeight: 100, objectFit: "contain" }}
                />
              </div>
            ) : (
              <div style={{ marginTop: 6, color: "var(--fg3)", fontSize: 13 }}>—</div>
            )}
          </div>
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
        <Field label="Categoria Google" value={agency.google_categoria} />
        <Field label="Telefono Google" value={agency.google_telefono} />
        <Field label="Sito Google" value={link(agency.google_sito)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Indirizzo Google" value={agency.google_indirizzo} />
        </div>
        <Field label="Google Place ID" value={agency.google_place_id} mono />
        <Field label="Foto Google" value={agency.google_foto_url} mono />
      </Section>

      {/* ============================================================== */}
      {/* NUOVE SEZIONI — data dictionary (0012_dictionary_additive.sql) */}
      {/* ============================================================== */}

      <Section title="Identità estesa">
        <Field label="Parent slug" value={agency.parent_slug} mono />
        <Field label="Legal form" value={agency.legal_form} />
        <Field label="Incorporation year" value={agency.incorporation_year} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Alternate names" value={arr(agency.alternate_names)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Founder / leader" value={json(agency.founder_leader)} />
        </div>
      </Section>

      <Section title="Servizi & fit clienti">
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Deliverables" value={arr(agency.deliverables)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Platforms & tech" value={arr(agency.platforms_tech)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Industries" value={arr(agency.industries)} />
        </div>
        <Field label="Audiences" value={arr(agency.audiences)} />
        <Field label="Ideal client sizes" value={arr(agency.ideal_client_sizes)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Engagement models" value={arr(agency.engagement_models)} />
        </div>
      </Section>

      <Section title="Pricing strutturato">
        <Field
          label="Budget minimo progetto"
          value={money(agency.min_project_budget, agency.min_project_currency)}
        />
        <Field
          label="Budget tipico (range)"
          value={
            agency.typical_project_min != null || agency.typical_project_max != null
              ? `${agency.typical_project_min?.toLocaleString("it-IT") ?? "?"} — ${agency.typical_project_max?.toLocaleString("it-IT") ?? "?"} ${agency.min_project_currency ?? "EUR"}`
              : null
          }
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Pricing models" value={arr(agency.pricing_models)} />
        </div>
      </Section>

      <Section title="Contenuti strutturati">
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Differentiators" value={json(agency.differentiators)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Declared methodology" value={agency.declared_methodology} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="FAQ" value={json(agency.faq)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Best for" value={json(agency.best_for)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Less suitable for" value={json(agency.less_suitable_for)} />
        </div>
      </Section>

      <Section title="Recensioni AI">
        <Field
          label="Analysis confidence"
          value={
            agency.review_analysis_confidence ? (
              <span className="bd-badge bd-muted">{agency.review_analysis_confidence}</span>
            ) : null
          }
        />
        <Field label="Recensioni analizzate" value={agency.review_analyzed_count} />
        <Field
          label="Snapshot date"
          value={
            agency.review_snapshot_date
              ? new Date(agency.review_snapshot_date).toLocaleDateString("it-IT")
              : null
          }
        />
        <div />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Summary" value={agency.review_summary} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Strengths ricorrenti" value={json(agency.review_strengths)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Criticisms ricorrenti" value={json(agency.review_criticisms)} />
        </div>
      </Section>

      <Section title="Valutazione editoriale">
        <Field
          label="Evidence grade"
          value={
            agency.evidence_grade ? (
              <span className="bd-badge bd-muted">{agency.evidence_grade}</span>
            ) : null
          }
        />
        <Field
          label="Evaluation confidence"
          value={
            agency.evaluation_confidence ? (
              <span className="bd-badge bd-muted">{agency.evaluation_confidence}</span>
            ) : null
          }
        />
        <Field
          label="Human reviewed"
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
          <Field label="Editorial summary" value={agency.editorial_summary} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Strengths (con evidenze)" value={json(agency.eval_strengths)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Limitations" value={json(agency.eval_limitations)} />
        </div>
      </Section>

      <Section title="Financial">
        <Field label="Revenue 2024" value={money(agency.revenue_2024, "EUR")} />
        <Field label="Employees 2024" value={agency.employees_2024} />
        <Field label="EBITDA 2024" value={money(agency.ebitda_2024, "EUR")} />
        <div />
        <Field label="Revenue 2025" value={money(agency.revenue_2025, "EUR")} />
        <Field label="Employees 2025" value={agency.employees_2025} />
        <Field label="EBITDA 2025" value={money(agency.ebitda_2025, "EUR")} />
        <div />
        <Field label="Revenue 2026" value={money(agency.revenue_2026, "EUR")} />
        <Field label="Employees 2026" value={agency.employees_2026} />
        <Field label="EBITDA 2026" value={money(agency.ebitda_2026, "EUR")} />
      </Section>

      <Section title="SEO">
        <Field label="SEO title (override)" value={agency.seo_title} />
        <Field
          label="Indexation status"
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
          <Field label="Meta description" value={agency.meta_description} />
        </div>
      </Section>

      <Section title="Workflow esteso">
        <Field
          label="Ultima verifica editoriale"
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
        <Field label="Note curatore" value={agency.note_curatore} />
        <Field label="Aggiornato" value={new Date(agency.updated_at).toLocaleString("it-IT")} />
      </Section>
    </div>
  );
}
