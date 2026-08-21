-- =====================================================================
-- 0002_agent_runs.sql
-- History delle esecuzioni degli agenti + granularità per riga processata
-- =====================================================================

create table if not exists public.agent_runs (
  id                uuid primary key default gen_random_uuid(),
  agent_id          text not null,             -- 'agency-updater','position-checker',...
  started_at        timestamptz not null default now(),
  completed_at     timestamptz,
  status            text not null default 'running'
                      check (status in ('running','success','error','partial','cancelled')),
  triggered_by      text not null,             -- 'cron','manual','user:<uuid>'

  rows_processed    int default 0,
  rows_success      int default 0,
  rows_error        int default 0,

  duration_ms       int,
  log               jsonb,                     -- messaggi + errori aggregati
  meta              jsonb                      -- config used, batch size, ecc.
);

create index if not exists agent_runs_agent_idx on public.agent_runs (agent_id, started_at desc);
create index if not exists agent_runs_status_idx on public.agent_runs (status);

-- Granularità: cosa è successo per ogni item (agenzia) durante il run
create table if not exists public.agent_run_items (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.agent_runs(id) on delete cascade,
  agency_id     uuid references public.agencies(id) on delete set null,

  status        text not null,                 -- 'success','error','skipped'
  sources_hit   jsonb,                         -- { firecrawl: 200, google_places: 200, vies: 404 }
  fields_updated text[],
  errors        jsonb,
  duration_ms   int,
  created_at    timestamptz not null default now()
);

create index if not exists agent_run_items_run_idx on public.agent_run_items (run_id);
create index if not exists agent_run_items_agency_idx on public.agent_run_items (agency_id);
