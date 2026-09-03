-- =====================================================================
-- 0009_competenze_split_and_skills.sql
--   1. Rinomina agencies.competenze → agencies.competenze_principali
--   2. Aggiunge competenze_core (max 2) e altre_competenze (max 10)
--   3. Backfill: eccedenti di principali → altre (fino a 10)
--   4. Nuova tabella agency_skills(domain_id, slug, label) — lista
--      controllata per dominio; l'agent updater può usare solo queste.
--   5. Seed 20 skill iniziali per miglioreagenzia.it
-- =====================================================================

-- 1. Rename colonna esistente (idempotente)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agencies' and column_name = 'competenze'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agencies' and column_name = 'competenze_principali'
  ) then
    alter table public.agencies rename column competenze to competenze_principali;
  end if;
end $$;

-- 2. Nuove colonne
alter table public.agencies
  add column if not exists competenze_core   text[],
  add column if not exists altre_competenze  text[];

-- 3. Backfill: se principali > 5, sposta la coda in altre_competenze (cap 10)
update public.agencies
   set altre_competenze     = coalesce(altre_competenze, '{}') || competenze_principali[6:15],
       competenze_principali = competenze_principali[1:5]
 where competenze_principali is not null
   and cardinality(competenze_principali) > 5;

-- 4. Check constraint sui cap (NULL è consentito → cardinality NULL non viola)
alter table public.agencies
  drop constraint if exists agencies_competenze_cardinality_check;
alter table public.agencies
  add constraint agencies_competenze_cardinality_check check (
    (competenze_core       is null or cardinality(competenze_core)       <= 2)  and
    (competenze_principali is null or cardinality(competenze_principali) <= 5)  and
    (altre_competenze      is null or cardinality(altre_competenze)      <= 10)
  );

-- 5. Indici (rinomina il GIN esistente + aggiungi per gli altri due)
do $$
begin
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='agencies_competenze_gin') then
    alter index public.agencies_competenze_gin rename to agencies_competenze_principali_gin;
  end if;
end $$;
create index if not exists agencies_competenze_core_gin on public.agencies using gin (competenze_core);
create index if not exists agencies_altre_competenze_gin on public.agencies using gin (altre_competenze);

-- =====================================================================
-- Tabella agency_skills — lista competenze permesse per dominio
-- =====================================================================
create table if not exists public.agency_skills (
  id           uuid primary key default gen_random_uuid(),
  domain_id    uuid not null references public.network_domains(id) on delete cascade,
  slug         text not null,
  label        text not null,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (domain_id, slug)
);

create index if not exists agency_skills_domain_idx on public.agency_skills (domain_id, sort_order);

drop trigger if exists agency_skills_set_updated_at on public.agency_skills;
create trigger agency_skills_set_updated_at
  before update on public.agency_skills
  for each row execute function public.set_updated_at();

alter table public.agency_skills enable row level security;

drop policy if exists agency_skills_read_auth on public.agency_skills;
create policy agency_skills_read_auth on public.agency_skills
  for select using (auth.uid() is not null);

drop policy if exists agency_skills_write_owner_dev on public.agency_skills;
create policy agency_skills_write_owner_dev on public.agency_skills
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );

-- =====================================================================
-- Seed skill iniziali per miglioreagenzia.it (idempotente)
-- =====================================================================
with dom as (
  select id from public.network_domains where domain = 'miglioreagenzia.it'
)
insert into public.agency_skills (domain_id, slug, label, sort_order)
select dom.id, s.slug, s.label, s.ord
  from dom,
       (values
          ('seo',                    'SEO',                    10),
          ('marketing',              'Marketing',              20),
          ('pubblicita',             'Pubblicità',             30),
          ('fotografia',             'Fotografia',             40),
          ('comunicazione',          'Comunicazione',          50),
          ('web-agency',             'Web Agency',             60),
          ('social-media',           'Social Media',           70),
          ('lead-generation',        'Lead Generation',        80),
          ('e-commerce',             'E-Commerce',             90),
          ('grafica',                'Grafica',               100),
          ('evento',                 'Evento',                110),
          ('pubbliche-relazioni',    'Pubbliche Relazioni',   120),
          ('e-mail-marketing',       'E-Mail Marketing',      130),
          ('strategia-di-contenuto', 'Strategia di contenuto',140),
          ('video',                  'Video',                 150),
          ('branding',               'Branding',              160),
          ('google-ads',             'Google Ads',            170),
          ('influencer-marketing',   'Influencer Marketing',  180),
          ('amazon-marketing',       'Amazon Marketing',      190),
          ('digital-pr',             'Digital PR',            200)
       ) as s(slug, label, ord)
on conflict (domain_id, slug) do nothing;
