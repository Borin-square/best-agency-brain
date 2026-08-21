"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface Agency {
  id: string;
  wp_id: number | null;
  slug: string | null;
  title: string;
  content: string | null;
  competenze: string[] | null;
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

  created_at: string;
  updated_at: string;
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
        <Field label="Competenze" value={arr(agency.competenze)} />
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
        <Field label="Foto del team" value={link(agency.foto_del_team)} />
      </Section>

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
