-- =====================================================================
-- 0019_agency_serp_position.sql
-- Traccia la posizione di miglioreagenzia.it nella SERP Google per
-- ogni agenzia (query = "nome + città"). Popolato dall'agente
-- agency-serp-position via DataForSEO API.
--
-- Storage: current state su agencies (4 flat fields) + storico
-- in agency_serp_snapshots per trend nel tempo.
-- =====================================================================

-- ---- Current state su agencies ----
alter table public.agencies
  add column if not exists serp_position   int,
  add column if not exists serp_query      text,
  add column if not exists serp_url        text,
  add column if not exists serp_checked_at timestamptz;

create index if not exists agencies_serp_position_idx
  on public.agencies (serp_position)
  where serp_position is not null;

-- ---- Storico snapshots ----
create table if not exists public.agency_serp_snapshots (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  checked_at  timestamptz not null default now(),
  query       text not null,
  position    int,           -- null = non trovata in top 100
  url         text,          -- URL specifica che ha rankato (se position not null)
  location    text,          -- location Google usata (es. "Italy")
  provider    text not null default 'dataforseo'
);

create index if not exists serp_snap_agency_time_idx
  on public.agency_serp_snapshots (agency_id, checked_at desc);
create index if not exists serp_snap_query_idx
  on public.agency_serp_snapshots (query);

alter table public.agency_serp_snapshots enable row level security;

drop policy if exists serp_snap_read_auth on public.agency_serp_snapshots;
create policy serp_snap_read_auth on public.agency_serp_snapshots
  for select using (auth.uid() is not null);

drop policy if exists serp_snap_write_owner_dev on public.agency_serp_snapshots;
create policy serp_snap_write_owner_dev on public.agency_serp_snapshots
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );

-- ---- Seed schedule (weekly, batch 100 = max DataForSEO POST) ----
insert into public.agent_schedules (agent_id, interval_minutes, enabled, refresh_days, batch_size)
values ('agency-serp-position', 10080, true, 6, 100)
on conflict (agent_id) do nothing;
