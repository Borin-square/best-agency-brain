-- =====================================================================
-- 0003_profiles.sql
-- Utenti brain: whitelist manuale con ruolo (owner|coord|dev)
-- Estende Supabase Auth (auth.users)
-- =====================================================================

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  full_name  text,
  role       text not null default 'coord'
               check (role in ('owner','coord','dev')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

-- RLS: solo utenti loggati leggono profili
alter table public.profiles enable row level security;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin"
  on public.profiles for select
  using ( auth.uid() = id or exists (
    select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role in ('owner','dev')
  ));

-- Trigger: quando un utente auth conferma email, se non è in profiles e non è in whitelist manuale, blocca
-- (whitelist manuale = seed iniziale via SQL admin)
