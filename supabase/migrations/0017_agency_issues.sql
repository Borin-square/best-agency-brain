-- =====================================================================
-- 0017_agency_issues.sql
-- Tracciamento issue di qualità sulle agenzie prodotte dall'agente
-- agency-quality-check. Ogni riga = un problema aperto/risolto per
-- una specifica agenzia. Unique su (agency_id, type) per idempotenza
-- (l'agente fa upsert al ri-detecting).
-- =====================================================================

create table if not exists public.agency_issues (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  type          text not null check (type in (
    'blacklist_domain',
    'dup_place_id',
    'dup_domain',
    'dup_vat',
    'dup_phone',
    'fuzzy_title_dup',
    'site_dead',
    'empty_agency',
    'test_placeholder',
    'enrichment_failing'
  )),
  severity      text not null check (severity in ('low', 'medium', 'high')),
  evidence      jsonb,        -- payload libero: { other_agency_ids:[...], domain, url, similarity, ... }
  detected_at   timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),  -- aggiornato ad ogni ri-detection
  resolved_at   timestamptz,
  resolution    text check (resolution in ('trashed','merged','ignored','fixed','superseded')),
  resolved_by   uuid,          -- auth.users.id di chi ha risolto (null = auto/agente)
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (agency_id, type)
);

create index if not exists agency_issues_open_idx
  on public.agency_issues (severity desc, type)
  where resolved_at is null;

create index if not exists agency_issues_agency_idx
  on public.agency_issues (agency_id)
  where resolved_at is null;

create index if not exists agency_issues_type_idx
  on public.agency_issues (type)
  where resolved_at is null;

drop trigger if exists agency_issues_set_updated_at on public.agency_issues;
create trigger agency_issues_set_updated_at
  before update on public.agency_issues
  for each row execute function public.set_updated_at();

alter table public.agency_issues enable row level security;

drop policy if exists agency_issues_read_auth on public.agency_issues;
create policy agency_issues_read_auth on public.agency_issues
  for select using (auth.uid() is not null);

drop policy if exists agency_issues_write_owner_dev on public.agency_issues;
create policy agency_issues_write_owner_dev on public.agency_issues
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );

-- Seed default schedule per il nuovo agente (idempotente).
-- ATTENZIONE: se batch_size supera il check constraint attivo su
-- agent_schedules (originariamente 1..100 dalla 0015), questo INSERT
-- fallisce e — in Supabase SQL Editor dove le migration girano in
-- transazione singola — rollbacka anche la CREATE TABLE sopra.
-- La migration 0018 alza il cap a 500 e va applicata PRIMA di questa.
insert into public.agent_schedules (agent_id, interval_minutes, enabled, refresh_days, batch_size)
values ('agency-quality-check', 1440, true, 7, 200)
on conflict (agent_id) do nothing;
