-- =====================================================================
-- 0013_agent_schedules.sql
-- Config dinamica dei cron degli agenti. Vercel Cron gira il dispatcher
-- ogni minuto (/api/cron/dispatch), che legge questa tabella e decide
-- quali agenti eseguire in base a interval_minutes vs last_run_at.
--
-- Il campo schedule nel config.ts degli agenti resta come default/documentazione
-- ma NON è più source of truth per lo scheduling.
-- =====================================================================

create table if not exists public.agent_schedules (
  agent_id           text primary key,
  interval_minutes   int not null default 60
                      check (interval_minutes >= 1 and interval_minutes <= 43200),
  enabled            bool not null default true,
  last_run_at        timestamptz,
  last_dispatched_at timestamptz,
  updated_at         timestamptz not null default now()
);

drop trigger if exists agent_schedules_set_updated_at on public.agent_schedules;
create trigger agent_schedules_set_updated_at
  before update on public.agent_schedules
  for each row execute function public.set_updated_at();

alter table public.agent_schedules enable row level security;

drop policy if exists agent_schedules_read_auth on public.agent_schedules;
create policy agent_schedules_read_auth on public.agent_schedules
  for select using (auth.uid() is not null);

drop policy if exists agent_schedules_write_owner_dev on public.agent_schedules;
create policy agent_schedules_write_owner_dev on public.agent_schedules
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );

-- Seed default per gli agenti attualmente registrati.
-- Enabled = true così che il dispatcher parte subito con la config precedente.
insert into public.agent_schedules (agent_id, interval_minutes, enabled) values
  ('agency-updater',           30, true),
  ('agency-visual-enrichment', 60, true)
on conflict (agent_id) do nothing;
