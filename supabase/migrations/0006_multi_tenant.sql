-- =====================================================================
-- 0006_multi_tenant.sql
-- Multi-tenant per dominio: agencies e agent_runs sono legate a un
-- network_domain. Backfill delle agenzie esistenti sul dominio primario
-- 'miglioreagenzia.it'.
-- =====================================================================

-- 1. Domino primario (idempotente: nessun errore se esiste già)
insert into public.network_domains (domain, country_code, country_name, status)
values ('miglioreagenzia.it', 'IT', 'Italia', 'online')
on conflict (domain) do nothing;

-- 2. Aggiungi domain_id
alter table public.agencies    add column if not exists domain_id uuid references public.network_domains(id) on delete restrict;
alter table public.agent_runs  add column if not exists domain_id uuid references public.network_domains(id) on delete set null;

-- 3. Backfill: tutte le agenzie esistenti → miglioreagenzia.it
update public.agencies
   set domain_id = (select id from public.network_domains where domain = 'miglioreagenzia.it')
 where domain_id is null;

-- 4. Ora possiamo mettere NOT NULL su agencies.domain_id
alter table public.agencies alter column domain_id set not null;

-- 5. Indici
create index if not exists agencies_domain_idx    on public.agencies    (domain_id);
create index if not exists agent_runs_domain_idx  on public.agent_runs  (domain_id);

-- 6. wp_id ora è unico PER DOMINIO (non globalmente) — permette di importare la
--    stessa wp_id da CSV di domini diversi.
alter table public.agencies drop constraint if exists agencies_wp_id_key;
create unique index if not exists agencies_wp_id_domain_uniq
  on public.agencies (domain_id, wp_id) where wp_id is not null;
