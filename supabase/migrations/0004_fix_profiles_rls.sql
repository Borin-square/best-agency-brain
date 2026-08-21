-- =====================================================================
-- 0004_fix_profiles_rls.sql
-- Fix ricorsione RLS su profiles.
-- La policy precedente conteneva una subquery su profiles che innescava
-- valutazione ricorsiva della policy stessa, bloccando la lettura.
-- =====================================================================

drop policy if exists "profiles_read_self_or_admin" on public.profiles;

create policy "profiles_read_self"
  on public.profiles for select
  using ( auth.uid() = id );
