-- =====================================================================
-- 0020_matrice_serp_positions.sql
-- Traccia posizione miglioreagenzia.it in SERP per ogni cella (area × skill)
-- della matrice listing. Query = "{modificatore} {label_skill} {label_area}".
-- Perimetro celle: (area, skill) con almeno 5 agenzie nel dominio.
--
-- Storage: current per cella + storico snapshot (analogo ad agencies).
-- =====================================================================

-- ---- Current state per cella ----
create table if not exists public.matrice_serp_positions (
  id           uuid primary key default gen_random_uuid(),
  domain_id    uuid not null references public.network_domains(id) on delete cascade,
  area_type    text not null check (area_type in ('regione', 'citta')),
  area_slug    text not null,
  skill_slug   text not null,
  query        text not null,
  position     int,           -- null = fuori top 100 (o non trovata)
  url          text,          -- URL specifica che ha rankato
  provider     text not null default 'dataforseo',
  checked_at   timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (domain_id, area_type, area_slug, skill_slug)
);

create index if not exists matrice_serp_pos_domain_idx
  on public.matrice_serp_positions (domain_id, area_type, area_slug, skill_slug);
create index if not exists matrice_serp_pos_position_idx
  on public.matrice_serp_positions (domain_id, position)
  where position is not null;

drop trigger if exists matrice_serp_pos_set_updated_at on public.matrice_serp_positions;
create trigger matrice_serp_pos_set_updated_at
  before update on public.matrice_serp_positions
  for each row execute function public.set_updated_at();

-- ---- Storico snapshots ----
create table if not exists public.matrice_serp_snapshots (
  id           uuid primary key default gen_random_uuid(),
  domain_id    uuid not null references public.network_domains(id) on delete cascade,
  area_type    text not null check (area_type in ('regione', 'citta')),
  area_slug    text not null,
  skill_slug   text not null,
  query        text not null,
  position     int,
  url          text,
  provider     text not null default 'dataforseo',
  checked_at   timestamptz not null default now()
);

create index if not exists matrice_serp_snap_cell_idx
  on public.matrice_serp_snapshots (domain_id, area_type, area_slug, skill_slug, checked_at desc);

-- ---- RLS ----
alter table public.matrice_serp_positions enable row level security;
alter table public.matrice_serp_snapshots enable row level security;

drop policy if exists mspos_read_auth on public.matrice_serp_positions;
create policy mspos_read_auth on public.matrice_serp_positions
  for select using (auth.uid() is not null);

drop policy if exists mspos_write_owner_dev on public.matrice_serp_positions;
create policy mspos_write_owner_dev on public.matrice_serp_positions
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );

drop policy if exists mssnap_read_auth on public.matrice_serp_snapshots;
create policy mssnap_read_auth on public.matrice_serp_snapshots
  for select using (auth.uid() is not null);

drop policy if exists mssnap_write_owner_dev on public.matrice_serp_snapshots;
create policy mssnap_write_owner_dev on public.matrice_serp_snapshots
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );

-- ---- Seed schedule (weekly, batch conservativo) ----
insert into public.agent_schedules (agent_id, interval_minutes, enabled, refresh_days, batch_size)
values ('matrice-serp-position', 10080, true, 6, 30)
on conflict (agent_id) do nothing;
