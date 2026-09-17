-- =====================================================================
-- 0018_agent_schedules_bump_batch.sql
-- Alza il cap batch_size da 100 a 500. Il cap iniziale (0015) era pensato
-- per agenti che fanno HTTP + LLM per singolo item; agenti pure-DB come
-- agency-quality-check possono scalare a 200+ senza rischio timeout.
-- Se serve alzare oltre 500 valutare seriamente il rischio di function
-- timeout (300s max) rispetto al tempo per-item.
-- =====================================================================

alter table public.agent_schedules
  drop constraint if exists agent_schedules_batch_size_check;
alter table public.agent_schedules
  add constraint agent_schedules_batch_size_check
    check (batch_size is null or (batch_size >= 1 and batch_size <= 500));
