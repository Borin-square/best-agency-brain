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
