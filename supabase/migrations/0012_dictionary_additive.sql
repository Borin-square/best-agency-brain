-- =====================================================================
-- 0012_dictionary_additive.sql
-- Aggiunge alla tabella agencies le colonne mancanti del dizionario dati.
-- Solo ADDITIVE: nessuna rimozione, nessuna rinomina, nessun cambio ai
-- campi esistenti. L'endpoint CSV vecchio continua a funzionare.
-- Le relazioni versioned (evaluations, review_snapshots, financial per
-- anno flessibile, evidence/field_assertions) verranno aggiunte in
-- migrazioni successive quando serviranno.
-- =====================================================================

alter table public.agencies
  -- Identità estesa
  add column if not exists parent_slug              text,
  add column if not exists alternate_names          text[],
  add column if not exists incorporation_year       int,
  add column if not exists legal_form               text,
  add column if not exists founder_leader           jsonb,

  -- Servizi estesi (oltre a competenze_core/principali/altre già esistenti)
  add column if not exists deliverables             text[],
  add column if not exists platforms_tech           text[],
  add column if not exists industries               text[],
  add column if not exists audiences                text[],
  add column if not exists ideal_client_sizes       text[],
  add column if not exists engagement_models        text[],

  -- Pricing strutturato (oltre a fascia_di_prezzo testuale già esistente)
  add column if not exists min_project_budget       int,
  add column if not exists min_project_currency     text default 'EUR',
  add column if not exists typical_project_min      int,
  add column if not exists typical_project_max      int,
  add column if not exists pricing_models           text[],

  -- Contenuti strutturati
  add column if not exists differentiators          jsonb,
  add column if not exists declared_methodology     text,
  add column if not exists faq                      jsonb,
  add column if not exists best_for                 jsonb,
  add column if not exists less_suitable_for        jsonb,

  -- Recensioni: sintesi AI + metadata snapshot
  add column if not exists review_summary               text,
  add column if not exists review_strengths             jsonb,
  add column if not exists review_criticisms            jsonb,
  add column if not exists review_analyzed_count        int,
  add column if not exists review_analysis_confidence   text,
  add column if not exists review_snapshot_date         date,

  -- Valutazione editoriale (ultima versione denormalizzata)
  add column if not exists editorial_summary        text,
  add column if not exists eval_strengths           jsonb,
  add column if not exists eval_limitations         jsonb,
  add column if not exists evidence_grade           text,
  add column if not exists evaluation_confidence    text,
  add column if not exists human_reviewed           boolean default false,

  -- Metriche finanziarie per anno (colonne fisse; espansione manuale annuale)
  add column if not exists revenue_2024             numeric,
  add column if not exists revenue_2025             numeric,
  add column if not exists revenue_2026             numeric,
  add column if not exists employees_2024           int,
  add column if not exists employees_2025           int,
  add column if not exists employees_2026           int,
  add column if not exists ebitda_2024              numeric,
  add column if not exists ebitda_2025              numeric,
  add column if not exists ebitda_2026              numeric,

  -- SEO override manuali (WP di default calcola dallo slug se null)
  add column if not exists seo_title                text,
  add column if not exists meta_description         text,
  add column if not exists indexation_status        text default 'noindex',

  -- Workflow esteso
  add column if not exists last_verified_at         timestamptz,
  add column if not exists quality_gate_score       numeric(3,2);

-- Enum check per indexation_status (idempotente)
alter table public.agencies drop constraint if exists agencies_indexation_status_check;
alter table public.agencies add constraint agencies_indexation_status_check
  check (indexation_status is null or indexation_status in ('noindex','eligible','index'));

-- Indici utili per filtri di export e ricerche facet
create index if not exists agencies_indexation_status_idx on public.agencies (indexation_status);
create index if not exists agencies_deliverables_gin      on public.agencies using gin (deliverables);
create index if not exists agencies_industries_gin        on public.agencies using gin (industries);
create index if not exists agencies_audiences_gin         on public.agencies using gin (audiences);
create index if not exists agencies_platforms_gin         on public.agencies using gin (platforms_tech);
