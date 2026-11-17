-- =====================================================================
-- 0033_skill_slug_immutabile.sql
--   Lo slug di una competenza non si cambia più dopo la creazione.
--   - È l'URL del sito (/{competenza}/ e tutte le combo /{competenza}/{area}/):
--     cambiarlo sposta pagine indicizzate senza redirect.
--   - Le agenzie citano le competenze per slug (competenze_core,
--     competenze_principali, altre_competenze): cambiarlo le stacca dalla
--     competenza in silenzio.
--   Per rinominare davvero serve una migrazione apposta che aggiorni le
--   agenzie e aggiunga i redirect. L'etichetta (label) resta modificabile.
-- =====================================================================

create or replace function public.agency_skills_slug_immutabile()
returns trigger
language plpgsql
as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'Lo slug della competenza "%" non si può cambiare: è l''URL del sito e lo usano le agenzie. Cambia l''etichetta.', old.slug;
  end if;
  return new;
end
$$;

drop trigger if exists agency_skills_slug_immutabile on public.agency_skills;
create trigger agency_skills_slug_immutabile
  before update of slug on public.agency_skills
  for each row
  execute function public.agency_skills_slug_immutabile();

revoke execute on function public.agency_skills_slug_immutabile() from public, anon, authenticated;
