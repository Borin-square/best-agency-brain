-- =====================================================================
-- 0011_agency_features.sql
-- Un'agenzia può essere "featured" in una specifica combinazione
-- area × competenza (es. Milano×SEO). Una riga = una feature.
-- Ordinabile con sort_order per gestire il ranking (1° in cima).
-- Selezione LIBERA: nessun vincolo che l'agenzia debba possedere
-- quella skill o area — il curatore può featurare chiunque ovunque.
-- =====================================================================

create table if not exists public.agency_features (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  area_type   text not null check (area_type in ('regione','citta')),
  area_slug   text not null,
  skill_slug  text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (agency_id, area_type, area_slug, skill_slug)
);

-- Query dominante: dammi le featured di questa combo, ordinate
create index if not exists agency_features_cell_idx
  on public.agency_features (area_type, area_slug, skill_slug, sort_order);

-- Query "per-agenzia": mostra tutte le combo di quell'agenzia
create index if not exists agency_features_agency_idx
  on public.agency_features (agency_id);

drop trigger if exists agency_features_set_updated_at on public.agency_features;
create trigger agency_features_set_updated_at
  before update on public.agency_features
  for each row execute function public.set_updated_at();

alter table public.agency_features enable row level security;

drop policy if exists agency_features_read_auth on public.agency_features;
create policy agency_features_read_auth on public.agency_features
  for select using (auth.uid() is not null);

drop policy if exists agency_features_write_owner_dev on public.agency_features;
create policy agency_features_write_owner_dev on public.agency_features
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );
