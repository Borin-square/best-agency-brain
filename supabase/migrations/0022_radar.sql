-- =====================================================================
-- 0022_radar.sql
-- Radar visitatori: traccia gli IP che visitano i siti del network
-- (miglioreagenzia.it e futuri cloni), li arricchisce con IP-to-company
-- e li correla con le agenzie già in DB.
--
-- Modello:
--   radar_pageviews: eventi raw (una riga per pageview)
--   radar_sessions:  aggregata IP+giorno con enrichment
-- Retention IP raw: 30gg → poi troncato a /24 (GDPR-friendly).
-- =====================================================================

-- ---- Pageviews raw --------------------------------------------------
create table if not exists public.radar_pageviews (
  id            uuid primary key default gen_random_uuid(),
  domain_id     uuid references public.network_domains(id) on delete set null,
  session_key   text not null,                    -- ip || '|' || YYYY-MM-DD
  ip            inet,                             -- nullato dopo 30gg
  ip_truncated  text,                             -- primi 3 ottetti "1.2.3.0/24" (persistente)
  url           text,
  path          text,
  referrer      text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index if not exists radar_pv_session_idx  on public.radar_pageviews (session_key);
create index if not exists radar_pv_created_idx  on public.radar_pageviews (created_at desc);
create index if not exists radar_pv_domain_idx   on public.radar_pageviews (domain_id, created_at desc);

-- ---- Sessions (aggregata + enrichment) ------------------------------
create table if not exists public.radar_sessions (
  session_key       text primary key,             -- ip || '|' || YYYY-MM-DD
  domain_id         uuid references public.network_domains(id) on delete set null,
  ip                inet,                         -- nullato dopo 30gg
  ip_truncated      text,
  day               date not null,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  pageviews_count   int not null default 1,
  user_agent        text,
  country           text,
  city              text,
  -- Enrichment
  enriched_at       timestamptz,
  enrich_error      text,
  company_name      text,
  company_domain    text,
  company_type      text,
  org               text,                         -- ISP/org come da IP intelligence
  asn               text,
  reverse_dns       text,
  -- Matching agenzia
  matched_agency_id uuid references public.agencies(id) on delete set null,
  match_score       numeric(4,3),                 -- 0..1
  match_reason      text,                         -- domain|name_fuzzy|reverse_dns|manual
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists radar_sess_day_idx        on public.radar_sessions (day desc);
create index if not exists radar_sess_domain_idx     on public.radar_sessions (domain_id, day desc);
create index if not exists radar_sess_enriched_idx   on public.radar_sessions (enriched_at nulls first);
create index if not exists radar_sess_matched_idx    on public.radar_sessions (matched_agency_id) where matched_agency_id is not null;

drop trigger if exists radar_sess_set_updated_at on public.radar_sessions;
create trigger radar_sess_set_updated_at
  before update on public.radar_sessions
  for each row execute function public.set_updated_at();

-- ---- RLS ------------------------------------------------------------
alter table public.radar_pageviews enable row level security;
alter table public.radar_sessions  enable row level security;

drop policy if exists radar_pv_read_auth on public.radar_pageviews;
create policy radar_pv_read_auth on public.radar_pageviews
  for select using (auth.uid() is not null);

drop policy if exists radar_pv_write_service on public.radar_pageviews;
create policy radar_pv_write_service on public.radar_pageviews
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','coord','dev'))
  );

drop policy if exists radar_sess_read_auth on public.radar_sessions;
create policy radar_sess_read_auth on public.radar_sessions
  for select using (auth.uid() is not null);

drop policy if exists radar_sess_write_service on public.radar_sessions;
create policy radar_sess_write_service on public.radar_sessions
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','coord','dev'))
  );

-- ---- Seed schedule per l'agente enricher ----------------------------
insert into public.agent_schedules (agent_id, interval_minutes, enabled, refresh_days, batch_size)
values ('radar-enricher', 15, true, 0, 50)
on conflict (agent_id) do nothing;
