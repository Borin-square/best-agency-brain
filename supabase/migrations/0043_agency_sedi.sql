-- =====================================================================
-- 0043_agency_sedi.sql
--   Sedi delle agenzie (docs/sedi-progetto.md). Non cambia niente nel brain
--   né sul sito: crea la tabella e le sue regole, ma agency_areas continua a
--   venire dal testo agencies.aree finché la 0044 non migra i dati e non
--   sposta il trigger sulle sedi.
--
--   - Una o più sedi per agenzia, al massimo una principale.
--   - Sede italiana: si sceglie il comune; la provincia (area_id) la calcola
--     il trigger dal comune e non si può scrivere a mano. Senza comune è
--     ammessa solo con la provincia già nota (dati migrati, "da completare").
--   - Sede estera: paese + città libera, nessuna area (non entra negli
--     archivi del sito).
-- Idempotente.
-- =====================================================================
begin;

create table if not exists public.agency_sedi (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  principale    boolean not null default false,
  paese         text not null default 'IT' check (paese ~ '^[A-Z]{2}$'),  -- ISO 3166-1 alpha-2
  comune_codice text references public.comuni(codice) on delete restrict,
  citta_estera  text,
  area_id       uuid references public.areas(id) on delete restrict,       -- calcolata dal trigger
  indirizzo     text,
  fonte         text check (fonte in ('sito', 'google', 'agenzia', 'verifica', 'migrazione')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint agency_sedi_italia_o_estero check (
    (paese = 'IT'  and citta_estera is null and area_id is not null)
 or (paese <> 'IT' and comune_codice is null and area_id is null and nullif(trim(citta_estera), '') is not null)
  )
);

create index if not exists agency_sedi_agency_idx on public.agency_sedi (agency_id);
create index if not exists agency_sedi_area_idx on public.agency_sedi (area_id);
-- Al massimo una sede principale per agenzia.
create unique index if not exists agency_sedi_una_principale on public.agency_sedi (agency_id) where principale;
-- Lo stesso comune una volta sola per agenzia.
create unique index if not exists agency_sedi_comune_unico on public.agency_sedi (agency_id, comune_codice) where comune_codice is not null;

alter table public.agency_sedi enable row level security;
revoke all on public.agency_sedi from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'brain_ro')
     and not exists (select 1 from pg_policies where tablename = 'agency_sedi' and policyname = 'brain_ro_select') then
    create policy brain_ro_select on public.agency_sedi for select to brain_ro using (true);
  end if;
end $$;

drop trigger if exists agency_sedi_set_updated_at on public.agency_sedi;
create trigger agency_sedi_set_updated_at
  before update on public.agency_sedi
  for each row execute function public.set_updated_at();

-- ---- Provincia calcolata dal comune ------------------------------------
create or replace function public.agency_sedi_area()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  provincia uuid;
begin
  new.paese := upper(new.paese);

  if new.paese <> 'IT' then
    new.comune_codice := null;
    new.area_id := null;
    return new;
  end if;

  if new.comune_codice is not null then
    select a.id into provincia
    from public.comuni c
    join public.agencies g on g.id = new.agency_id
    join public.areas a on a.domain_id = g.domain_id and a.sigla = c.sigla and a.tipo = 'citta'
    where c.codice = new.comune_codice;

    if provincia is null then
      raise exception 'Il comune % non ha una provincia tra le aree del dominio dell''agenzia', new.comune_codice;
    end if;
    new.area_id := provincia;
    return new;
  end if;

  -- Sede italiana senza comune: solo con una provincia già nota (dati migrati).
  if new.area_id is null then
    raise exception 'Sede in Italia senza comune: scegli il comune';
  end if;
  if not exists (
    select 1 from public.areas a join public.agencies g on g.id = new.agency_id
    where a.id = new.area_id and a.tipo = 'citta' and a.domain_id = g.domain_id
  ) then
    raise exception 'La sede deve stare in una provincia del dominio dell''agenzia, non in una regione';
  end if;
  return new;
end
$$;

drop trigger if exists agency_sedi_area on public.agency_sedi;
create trigger agency_sedi_area
  before insert or update on public.agency_sedi
  for each row execute function public.agency_sedi_area();

-- ---- Funzioni usate dalla 0044 (qui solo definite, non collegate) -------

-- agency_areas di un'agenzia = le province delle sue sedi italiane.
create or replace function public.allinea_agency_areas_da_sedi(p_agency_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.agency_areas where agency_id = p_agency_id;
  insert into public.agency_areas (agency_id, area_id)
  select distinct p_agency_id, s.area_id
  from public.agency_sedi s
  where s.agency_id = p_agency_id and s.area_id is not null
  on conflict do nothing;
$$;

-- ---- Sedi da completare (italiane senza comune) -------------------------
create or replace view public.agency_sedi_da_completare as
select s.id as sede_id, g.id as agency_id, g.title, g.publish_status, s.principale,
       a.slug as provincia, s.indirizzo, g.google_indirizzo, g.indirizzo_completo
from public.agency_sedi s
join public.agencies g on g.id = s.agency_id
join public.areas a on a.id = s.area_id
where s.paese = 'IT' and s.comune_codice is null;

revoke all on public.agency_sedi_da_completare from anon, authenticated;

select count(*) as sedi from public.agency_sedi;

commit;
