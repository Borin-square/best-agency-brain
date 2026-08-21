-- =====================================================================
-- 0005_network_and_agency_extra.sql
--   1. network_domains: tab Network — domini esteri del progetto
--   2. Estende agencies con campi extra usati dal completeness score
--      (logo_url, photos, portfolio, case_studies, google_partner_cert)
-- =====================================================================

-- ---- Network domains -------------------------------------------------
create table if not exists public.network_domains (
  id              uuid primary key default gen_random_uuid(),
  domain          text not null unique,          -- es. 'miglioreagenzia.es'
  country_code    text not null,                 -- ISO 3166-1 alpha-2 (IT, ES, DE, FR...)
  country_name    text not null,                 -- Nome esteso
  logo_url        text,                          -- URL logo (opzionale)
  status          text not null default 'acquistato'
                    check (status in ('acquistato','in_costruzione','online','fase_1','fase_2','fase_3')),
  notes           text,
  launch_date     date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists network_domains_status_idx  on public.network_domains (status);
create index if not exists network_domains_country_idx on public.network_domains (country_code);

drop trigger if exists network_domains_set_updated_at on public.network_domains;
create trigger network_domains_set_updated_at
  before update on public.network_domains
  for each row execute function public.set_updated_at();

alter table public.network_domains enable row level security;

drop policy if exists network_domains_read_auth on public.network_domains;
create policy network_domains_read_auth on public.network_domains
  for select using (auth.uid() is not null);

drop policy if exists network_domains_write_owner_dev on public.network_domains;
create policy network_domains_write_owner_dev on public.network_domains
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );

-- ---- Agencies: campi extra per completeness score --------------------
alter table public.agencies
  add column if not exists logo_url            text,
  add column if not exists photos              jsonb,   -- array di URL
  add column if not exists portfolio           jsonb,   -- array di { title, url, thumbnail? }
  add column if not exists case_studies        jsonb,   -- array di { title, url, description }
  add column if not exists google_partner_cert boolean default false;
