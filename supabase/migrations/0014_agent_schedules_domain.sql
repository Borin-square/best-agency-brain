-- =====================================================================
-- 0014_agent_schedules_domain.sql
-- Aggiunge agent_schedules.domain_id per limitare l'esecuzione del cron
-- a uno specifico dominio. NULL = globale (tutti i domini attivi come prima).
-- Il dispatcher passerà ?domain_id=... all'endpoint dell'agente quando presente.
-- =====================================================================

alter table public.agent_schedules
  add column if not exists domain_id uuid
    references public.network_domains(id) on delete set null;

create index if not exists agent_schedules_domain_idx
  on public.agent_schedules (domain_id);
