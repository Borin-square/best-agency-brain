-- =====================================================================
-- 0021_pricing.sql
-- Volume di ricerca + CPC per cella matrice + settings di pricing globali
-- (markup e percentuali slot featured 1/2/3).
-- =====================================================================

-- ---- Volume + CPC per cella (current + snapshot) ----
alter table public.matrice_serp_positions
  add column if not exists search_volume    int,
  add column if not exists cpc              numeric(10,2),
  add column if not exists volume_updated_at timestamptz;

alter table public.matrice_serp_snapshots
  add column if not exists search_volume    int,
  add column if not exists cpc              numeric(10,2);

-- ---- Pricing settings (single-row globale) ----
create table if not exists public.pricing_settings (
  id           text primary key default 'default',
  markup       numeric(6,3)  not null default 3.000,   -- moltiplicatore applicato al valore lordo
  slot_1_pct   numeric(5,4)  not null default 1.0000,  -- 100% del prezzo pieno
  slot_2_pct   numeric(5,4)  not null default 0.7000,  -- 70%
  slot_3_pct   numeric(5,4)  not null default 0.5000,  -- 50%
  currency     text          not null default 'EUR',
  updated_at   timestamptz   not null default now()
);

insert into public.pricing_settings (id) values ('default')
  on conflict (id) do nothing;

drop trigger if exists pricing_settings_set_updated_at on public.pricing_settings;
create trigger pricing_settings_set_updated_at
  before update on public.pricing_settings
  for each row execute function public.set_updated_at();

-- ---- RLS ----
alter table public.pricing_settings enable row level security;

drop policy if exists pricing_settings_read_auth on public.pricing_settings;
create policy pricing_settings_read_auth on public.pricing_settings
  for select using (auth.uid() is not null);

drop policy if exists pricing_settings_write_owner_dev on public.pricing_settings;
create policy pricing_settings_write_owner_dev on public.pricing_settings
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('owner','dev'))
  );
