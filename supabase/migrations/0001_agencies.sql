-- =====================================================================
-- 0001_agencies.sql
-- Tabella agenzie miglioreagenzia.it — allineata 1:1 al template WP All Import
-- (37 colonne export + campi enrichment tracking + slug interno + timestamps)
--
-- Convenzione: manteniamo i nomi tecnici (snake_case) qui, il CSV export
-- rimappa ai nomi italiani originali (Title, Content, Città, ecc.).
-- =====================================================================

create extension if not exists "pgcrypto";

create table if not exists public.agencies (
  id                        uuid primary key default gen_random_uuid(),
  wp_id                     int unique,                    -- ID WordPress (per re-import/aggiornamento incrementale)
  slug                      text unique,                   -- slug interno (auto-generato da title)

  -- === CAMPI CORE (colonne WP All Import 1-9) ===
  title                     text not null,                 -- Title
  content                   text,                          -- Content (descrizione lunga HTML/markdown)
  competenze                text[],                        -- Competenze (pipe → array): branding|comunicazione|marketing|web-agency
  caratteristiche           text[],                        -- Caratteristiche (pipe → array)
  aree                      text,                          -- Aree formato "Marche>Ancona"
  citta                     text,                          -- Città (slug: 'ancona')
  regioni                   text,                          -- Regioni (slug: 'marche')
  status_curatela           text,                          -- proposta | verificata | rifiutata | ...

  -- === CONTATTI & CONTENUTI (10-20) ===
  descrizione_breve         text,                          -- Descrizione breve
  foto_del_team             text,                          -- Foto del team (URL)
  sito_web                  text,                          -- Sito web
  email                     text,
  telefono                  text,
  indirizzo_completo        text,                          -- Indirizzo completo (multiline)
  anno_di_fondazione        int,                           -- Anno di fondazione
  dimensione_team           text,                          -- Dimensione team ('1-10','11-50',...)
  lingue                    text[],                        -- Lingue (pipe → array): it|en
  fascia_di_prezzo          text,                          -- Fascia di prezzo
  partita_iva               text,                          -- Partita IVA

  -- === CLASSIFICAZIONE & SOCIAL (21-23) ===
  pillar_primario_slug      text,                          -- Pillar primario (slug)
  linkedin                  text,
  instagram                 text,
  behance                   text,

  -- === ARRICCHIMENTO GOOGLE (24-33) ===
  google_rating             numeric(2,1),
  google_recensioni_count   int,
  match_confidence          numeric(3,2),                  -- 0.0-1.0
  google_indirizzo          text,
  google_telefono           text,
  google_sito               text,
  google_categoria          text,
  google_foto_url           text,
  google_place_id           text,

  -- === STATO WP (34-36) ===
  verifica                  text,                          -- verified | to-review | ...
  title_originale           text,                          -- title prima di normalizzazione
  publish_status            text default 'publish',        -- publish | draft | pending
  note_curatore             text,                          -- Note curatore

  -- === ENRICHMENT TRACKING (interno brain, non esportato) ===
  last_enriched_at          timestamptz,
  enrichment_status         text,                          -- success | partial | error | never
  enrichment_errors         jsonb,
  sources_used              jsonb,                         -- { firecrawl: true, google_places: true, vies: false, claude: true }

  -- === TIMESTAMP ===
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists agencies_wp_id_idx           on public.agencies (wp_id);
create index if not exists agencies_citta_idx           on public.agencies (citta);
create index if not exists agencies_regioni_idx         on public.agencies (regioni);
create index if not exists agencies_status_curatela_idx on public.agencies (status_curatela);
create index if not exists agencies_verifica_idx        on public.agencies (verifica);
create index if not exists agencies_last_enriched_idx   on public.agencies (last_enriched_at nulls first);
create index if not exists agencies_competenze_gin      on public.agencies using gin (competenze);
create index if not exists agencies_caratteristiche_gin on public.agencies using gin (caratteristiche);

-- Auto-updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agencies_set_updated_at on public.agencies;
create trigger agencies_set_updated_at
  before update on public.agencies
  for each row execute function public.set_updated_at();
