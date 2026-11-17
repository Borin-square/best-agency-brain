-- =====================================================================
-- 0031_combo_whitelist.sql
--   Le combo competenza × città già indicizzate quando si migra il sito
--   (/{competenza}/{area}/). Restano pubbliche (200) anche quando scendono
--   sotto la soglia minima di agenzie: ciò che Google ha indicizzato non
--   torna 404, e un 301 non deve mai puntare a un 404.
--   - Append-only: le righe non si modificano né si cancellano (lo blocca
--     un trigger). Per toglierne una davvero serve una migrazione apposta.
--   - Collegata per id a competenza e area: se cambia uno slug, la combo
--     lo segue.
-- Riempita con le 171 combo di inc/combo-whitelist.php del tema WordPress
-- (sondaggio degli URL del live, agosto 2026).
-- =====================================================================

create table if not exists public.combo_whitelist (
  domain_id  uuid not null references public.network_domains(id) on delete cascade,
  skill_id   uuid not null references public.agency_skills(id) on delete restrict,
  area_id    uuid not null references public.areas(id) on delete restrict,
  motivo     text not null,
  created_at timestamptz not null default now(),
  primary key (domain_id, skill_id, area_id)
);

alter table public.combo_whitelist enable row level security;
revoke all on public.combo_whitelist from anon, authenticated;

-- ---- Append-only -------------------------------------------------------
create or replace function public.combo_whitelist_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'combo_whitelist è append-only: una combo indicizzata non si toglie (% non ammesso)', tg_op;
end
$$;

drop trigger if exists combo_whitelist_append_only on public.combo_whitelist;
create trigger combo_whitelist_append_only
  before update or delete on public.combo_whitelist
  for each row
  execute function public.combo_whitelist_append_only();

-- TRUNCATE non passa dai trigger di riga: serve il suo.
drop trigger if exists combo_whitelist_no_truncate on public.combo_whitelist;
create trigger combo_whitelist_no_truncate
  before truncate on public.combo_whitelist
  for each statement
  execute function public.combo_whitelist_append_only();

revoke execute on function public.combo_whitelist_append_only() from public, anon, authenticated;

-- ---- Riempimento iniziale ----------------------------------------------
-- Se una competenza o un'area non si trova, si ferma tutto: meglio un
-- errore che una combo indicizzata persa in silenzio.
do $$
declare
  dominio uuid := (select id from public.network_domains where domain = 'miglioreagenzia.it');
  mancanti text;
begin
  create temp table combo_seed (skill_slug text, area_slug text) on commit drop;
  insert into combo_seed values
    ('branding', 'bari'), ('branding', 'bergamo'), ('branding', 'bologna'), ('branding', 'firenze'),
    ('branding', 'genova'), ('branding', 'milano'), ('branding', 'palermo'), ('branding', 'roma'),
    ('branding', 'torino'), ('branding', 'venezia'), ('comunicazione', 'bari'), ('comunicazione', 'bergamo'),
    ('comunicazione', 'bologna'), ('comunicazione', 'brescia'), ('comunicazione', 'catania'), ('comunicazione', 'cuneo'),
    ('comunicazione', 'ferrara'), ('comunicazione', 'firenze'), ('comunicazione', 'genova'), ('comunicazione', 'milano'),
    ('comunicazione', 'modena'), ('comunicazione', 'napoli'), ('comunicazione', 'novara'), ('comunicazione', 'padova'),
    ('comunicazione', 'palermo'), ('comunicazione', 'parma'), ('comunicazione', 'roma'), ('comunicazione', 'torino'),
    ('comunicazione', 'treviso'), ('comunicazione', 'venezia'), ('comunicazione', 'verona'), ('comunicazione', 'vicenza'),
    ('e-commerce', 'bari'), ('e-commerce', 'bologna'), ('e-commerce', 'cuneo'), ('e-commerce', 'ferrara'),
    ('e-commerce', 'firenze'), ('e-commerce', 'milano'), ('e-commerce', 'modena'), ('e-commerce', 'napoli'),
    ('e-commerce', 'padova'), ('e-commerce', 'palermo'), ('e-commerce', 'roma'), ('e-commerce', 'treviso'),
    ('e-commerce', 'venezia'), ('e-commerce', 'verona'), ('eventi', 'bergamo'), ('eventi', 'bologna'),
    ('eventi', 'brescia'), ('eventi', 'catania'), ('eventi', 'ferrara'), ('eventi', 'firenze'),
    ('eventi', 'milano'), ('eventi', 'napoli'), ('eventi', 'roma'), ('eventi', 'torino'),
    ('eventi', 'venezia'), ('eventi', 'verona'), ('google-ads', 'bologna'), ('google-ads', 'ferrara'),
    ('google-ads', 'firenze'), ('google-ads', 'milano'), ('google-ads', 'roma'), ('google-ads', 'torino'),
    ('google-ads', 'venezia'), ('google-ads', 'vicenza'), ('influencer-marketing', 'milano'), ('influencer-marketing', 'venezia'),
    ('lead-generation', 'milano'), ('lead-generation', 'roma'), ('lead-generation', 'torino'), ('marketing', 'bari'),
    ('marketing', 'bergamo'), ('marketing', 'bologna'), ('marketing', 'brescia'), ('marketing', 'catania'),
    ('marketing', 'cuneo'), ('marketing', 'ferrara'), ('marketing', 'firenze'), ('marketing', 'genova'),
    ('marketing', 'lecce'), ('marketing', 'milano'), ('marketing', 'modena'), ('marketing', 'napoli'),
    ('marketing', 'novara'), ('marketing', 'padova'), ('marketing', 'palermo'), ('marketing', 'parma'),
    ('marketing', 'reggio-emilia'), ('marketing', 'roma'), ('marketing', 'torino'), ('marketing', 'treviso'),
    ('marketing', 'venezia'), ('marketing', 'verona'), ('marketing', 'vicenza'), ('pubblicita', 'bari'),
    ('pubblicita', 'bergamo'), ('pubblicita', 'bologna'), ('pubblicita', 'brescia'), ('pubblicita', 'catania'),
    ('pubblicita', 'cuneo'), ('pubblicita', 'ferrara'), ('pubblicita', 'firenze'), ('pubblicita', 'genova'),
    ('pubblicita', 'milano'), ('pubblicita', 'modena'), ('pubblicita', 'napoli'), ('pubblicita', 'novara'),
    ('pubblicita', 'padova'), ('pubblicita', 'palermo'), ('pubblicita', 'parma'), ('pubblicita', 'roma'),
    ('pubblicita', 'torino'), ('pubblicita', 'treviso'), ('pubblicita', 'venezia'), ('pubblicita', 'verona'),
    ('pubblicita', 'vicenza'), ('seo', 'bari'), ('seo', 'bergamo'), ('seo', 'bologna'),
    ('seo', 'catania'), ('seo', 'firenze'), ('seo', 'genova'), ('seo', 'lecce'),
    ('seo', 'milano'), ('seo', 'modena'), ('seo', 'napoli'), ('seo', 'novara'),
    ('seo', 'padova'), ('seo', 'palermo'), ('seo', 'parma'), ('seo', 'roma'),
    ('seo', 'torino'), ('seo', 'treviso'), ('seo', 'venezia'), ('seo', 'verona'),
    ('social-media', 'bologna'), ('social-media', 'brescia'), ('social-media', 'cuneo'), ('social-media', 'firenze'),
    ('social-media', 'milano'), ('social-media', 'modena'), ('social-media', 'napoli'), ('social-media', 'palermo'),
    ('social-media', 'roma'), ('social-media', 'venezia'), ('social-media', 'verona'), ('web-agency', 'bari'),
    ('web-agency', 'bergamo'), ('web-agency', 'bologna'), ('web-agency', 'brescia'), ('web-agency', 'catania'),
    ('web-agency', 'cuneo'), ('web-agency', 'ferrara'), ('web-agency', 'firenze'), ('web-agency', 'genova'),
    ('web-agency', 'lecce'), ('web-agency', 'milano'), ('web-agency', 'modena'), ('web-agency', 'napoli'),
    ('web-agency', 'novara'), ('web-agency', 'padova'), ('web-agency', 'palermo'), ('web-agency', 'parma'),
    ('web-agency', 'reggio-emilia'), ('web-agency', 'roma'), ('web-agency', 'torino'), ('web-agency', 'treviso'),
    ('web-agency', 'venezia'), ('web-agency', 'verona'), ('web-agency', 'vicenza');

  select string_agg(c.skill_slug || '|' || c.area_slug, ', ') into mancanti
  from combo_seed c
  left join public.agency_skills s on s.domain_id = dominio and s.slug = c.skill_slug
  left join public.areas a on a.domain_id = dominio and a.slug = c.area_slug
  where s.id is null or a.id is null;
  if mancanti is not null then
    raise exception 'Combo con competenza o area sconosciuta: %', mancanti;
  end if;

  insert into public.combo_whitelist (domain_id, skill_id, area_id, motivo)
  select dominio, s.id, a.id, 'indicizzata sul live (sondaggio agosto 2026)'
  from combo_seed c
  join public.agency_skills s on s.domain_id = dominio and s.slug = c.skill_slug
  join public.areas a on a.domain_id = dominio and a.slug = c.area_slug
  on conflict do nothing;
end
$$;

-- ---- Vista per il sito -------------------------------------------------
create or replace view site.combo_whitelist as
select w.domain_id, s.slug as skill_slug, a.slug as area_slug
from public.combo_whitelist w
join public.agency_skills s on s.id = w.skill_id
join public.areas a on a.id = w.area_id;

revoke all on site.combo_whitelist from public, anon, authenticated;
grant select on site.combo_whitelist to site_reader;
