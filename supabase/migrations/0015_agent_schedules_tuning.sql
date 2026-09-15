-- =====================================================================
-- 0015_agent_schedules_tuning.sql
-- Aggiunge agent_schedules.refresh_days e batch_size come override
-- opzionali del comportamento hardcoded nel codice dell'agente.
-- NULL = usa il default del codice (REFRESH_DAYS, BATCH_SIZE).
-- =====================================================================

alter table public.agent_schedules
  add column if not exists refresh_days int
    check (refresh_days is null or (refresh_days >= 0 and refresh_days <= 365)),
  add column if not exists batch_size int
    check (batch_size is null or (batch_size >= 1 and batch_size <= 100));
