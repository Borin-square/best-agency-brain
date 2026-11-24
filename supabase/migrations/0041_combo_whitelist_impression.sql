-- =====================================================================
-- 0041_combo_whitelist_impression.sql
--   Aggiunge a combo_whitelist le combo competenza × città pubbliche sul
--   live il 24/11/2026 (mg_combo_pubbliche() via WP-CLI: 722) che hanno
--   avuto almeno un'impression in Search Console negli ultimi 3 mesi: 340,
--   che diventano 332 scrivendo le combo su monza-e-brianza con lo slug
--   canonico monza-e-della-brianza (8 erano presenti con tutti e due).
--   96 erano già in whitelist: le righe nuove sono 236. Le 382 senza
--   impression restano fuori: se scendono sotto le 5 agenzie tornano 404,
--   ma Google non le mostrava.
--   Idempotente: rilanciarla non aggiunge righe.
-- =====================================================================
begin;

-- Combo pubbliche sul live il 24/11/2026 con almeno un'impression in Search Console (ultimi 3 mesi).
create temp table combo_live (skill_slug text, area_slug text) on commit drop;
insert into combo_live values
  ('branding','bari'), ('branding','bologna'), ('branding','cagliari'), ('branding','ferrara'), ('branding','genova'), ('branding','monza-e-della-brianza'),
  ('branding','pesaro-e-urbino'), ('branding','pordenone'), ('branding','ravenna'), ('branding','reggio-emilia'), ('branding','salerno'), ('branding','treviso'),
  ('branding','varese'), ('branding','venezia'), ('comunicazione','ancona'), ('comunicazione','bari'), ('comunicazione','bergamo'), ('comunicazione','bologna'),
  ('comunicazione','cuneo'), ('comunicazione','mantova'), ('comunicazione','milano'), ('comunicazione','modena'), ('comunicazione','napoli'), ('comunicazione','palermo'),
  ('comunicazione','parma'), ('comunicazione','pesaro-e-urbino'), ('comunicazione','pisa'), ('comunicazione','ravenna'), ('comunicazione','siena'), ('comunicazione','torino'),
  ('comunicazione','venezia'), ('comunicazione','vicenza'), ('digital-pr','bologna'), ('digital-pr','napoli'), ('digital-pr','roma'), ('digital-pr','torino'),
  ('digital-pr','venezia'), ('e-commerce','biella'), ('e-commerce','bologna'), ('e-commerce','bolzano'), ('e-commerce','brescia'), ('e-commerce','como'),
  ('e-commerce','lecce'), ('e-commerce','lucca'), ('e-commerce','milano'), ('e-commerce','padova'), ('e-commerce','perugia'), ('e-commerce','pesaro-e-urbino'),
  ('e-commerce','pescara'), ('e-commerce','rimini'), ('e-commerce','siena'), ('e-commerce','trento'), ('e-commerce','treviso'), ('e-commerce','varese'),
  ('e-commerce','venezia'), ('e-mail-marketing','arezzo'), ('e-mail-marketing','cagliari'), ('e-mail-marketing','catania'), ('e-mail-marketing','cuneo'), ('e-mail-marketing','firenze'),
  ('e-mail-marketing','genova'), ('e-mail-marketing','lucca'), ('e-mail-marketing','modena'), ('e-mail-marketing','novara'), ('e-mail-marketing','parma'), ('e-mail-marketing','pesaro-e-urbino'),
  ('e-mail-marketing','pisa'), ('e-mail-marketing','pistoia'), ('e-mail-marketing','pordenone'), ('e-mail-marketing','ravenna'), ('e-mail-marketing','reggio-emilia'), ('e-mail-marketing','rimini'),
  ('e-mail-marketing','siena'), ('e-mail-marketing','torino'), ('e-mail-marketing','trento'), ('e-mail-marketing','varese'), ('eventi','bergamo'), ('eventi','brescia'),
  ('eventi','firenze'), ('eventi','milano'), ('eventi','monza-e-della-brianza'), ('eventi','napoli'), ('eventi','parma'), ('eventi','perugia'),
  ('eventi','pescara'), ('eventi','roma'), ('eventi','torino'), ('eventi','trento'), ('eventi','varese'), ('eventi','venezia'),
  ('eventi','vicenza'), ('fotografia','ancona'), ('fotografia','bari'), ('fotografia','bergamo'), ('fotografia','bologna'), ('fotografia','catania'),
  ('fotografia','como'), ('fotografia','ferrara'), ('fotografia','genova'), ('fotografia','lecce'), ('fotografia','modena'), ('fotografia','monza-e-della-brianza'),
  ('fotografia','napoli'), ('fotografia','palermo'), ('fotografia','salerno'), ('fotografia','torino'), ('fotografia','udine'), ('fotografia','varese'),
  ('fotografia','verona'), ('google-ads','bologna'), ('google-ads','firenze'), ('google-ads','padova'), ('google-ads','roma'), ('grafica','ancona'),
  ('grafica','arezzo'), ('grafica','bergamo'), ('grafica','brescia'), ('grafica','cagliari'), ('grafica','caserta'), ('grafica','como'),
  ('grafica','forli-cesena'), ('grafica','monza-e-della-brianza'), ('grafica','novara'), ('grafica','palermo'), ('grafica','parma'), ('grafica','pescara'),
  ('grafica','pordenone'), ('grafica','prato'), ('grafica','reggio-emilia'), ('grafica','siena'), ('grafica','trento'), ('grafica','treviso'),
  ('grafica','udine'), ('grafica','varese'), ('grafica','verona'), ('influencer-marketing','milano'), ('lead-generation','ancona'), ('lead-generation','bari'),
  ('lead-generation','bergamo'), ('lead-generation','brescia'), ('lead-generation','genova'), ('lead-generation','monza-e-della-brianza'), ('lead-generation','parma'), ('lead-generation','treviso'),
  ('lead-generation','varese'), ('lead-generation','verona'), ('lead-generation','vicenza'), ('marketing','arezzo'), ('marketing','bari'), ('marketing','bologna'),
  ('marketing','brescia'), ('marketing','cosenza'), ('marketing','ferrara'), ('marketing','forli-cesena'), ('marketing','genova'), ('marketing','lecce'),
  ('marketing','lucca'), ('marketing','milano'), ('marketing','modena'), ('marketing','monza-e-della-brianza'), ('marketing','napoli'), ('marketing','novara'),
  ('marketing','padova'), ('marketing','palermo'), ('marketing','pisa'), ('marketing','reggio-emilia'), ('marketing','roma'), ('marketing','salerno'),
  ('marketing','sassari'), ('marketing','varese'), ('marketing','venezia'), ('marketing','verona'), ('marketing','vicenza'), ('pubbliche-relazioni','bergamo'),
  ('pubbliche-relazioni','ferrara'), ('pubbliche-relazioni','torino'), ('pubblicita','arezzo'), ('pubblicita','bari'), ('pubblicita','bergamo'), ('pubblicita','bologna'),
  ('pubblicita','brescia'), ('pubblicita','cagliari'), ('pubblicita','catania'), ('pubblicita','cosenza'), ('pubblicita','cuneo'), ('pubblicita','firenze'),
  ('pubblicita','forli-cesena'), ('pubblicita','frosinone'), ('pubblicita','lucca'), ('pubblicita','milano'), ('pubblicita','monza-e-della-brianza'), ('pubblicita','napoli'),
  ('pubblicita','novara'), ('pubblicita','palermo'), ('pubblicita','parma'), ('pubblicita','pescara'), ('pubblicita','piacenza'), ('pubblicita','pisa'),
  ('pubblicita','pistoia'), ('pubblicita','prato'), ('pubblicita','ravenna'), ('pubblicita','reggio-emilia'), ('pubblicita','rimini'), ('pubblicita','roma'),
  ('pubblicita','salerno'), ('pubblicita','torino'), ('pubblicita','trento'), ('pubblicita','varese'), ('pubblicita','venezia'), ('pubblicita','verona'),
  ('seo','ancona'), ('seo','arezzo'), ('seo','bergamo'), ('seo','bolzano'), ('seo','cagliari'), ('seo','caserta'),
  ('seo','cosenza'), ('seo','forli-cesena'), ('seo','genova'), ('seo','lecce'), ('seo','lecco'), ('seo','milano'),
  ('seo','monza-e-della-brianza'), ('seo','novara'), ('seo','parma'), ('seo','perugia'), ('seo','piacenza'), ('seo','pistoia'),
  ('seo','pordenone'), ('seo','prato'), ('seo','reggio-emilia'), ('seo','salerno'), ('seo','trento'), ('seo','treviso'),
  ('seo','udine'), ('seo','venezia'), ('seo','verona'), ('social-media','ancona'), ('social-media','bari'), ('social-media','bergamo'),
  ('social-media','catania'), ('social-media','como'), ('social-media','cuneo'), ('social-media','ferrara'), ('social-media','lecce'), ('social-media','milano'),
  ('social-media','monza-e-della-brianza'), ('social-media','napoli'), ('social-media','parma'), ('social-media','pesaro-e-urbino'), ('social-media','pescara'), ('social-media','roma'),
  ('social-media','salerno'), ('social-media','siena'), ('social-media','trento'), ('social-media','verona'), ('social-media','vicenza'), ('strategia-di-contenuto','bari'),
  ('strategia-di-contenuto','bergamo'), ('strategia-di-contenuto','firenze'), ('strategia-di-contenuto','lecce'), ('strategia-di-contenuto','modena'), ('strategia-di-contenuto','napoli'), ('strategia-di-contenuto','padova'),
  ('strategia-di-contenuto','pescara'), ('strategia-di-contenuto','roma'), ('strategia-di-contenuto','treviso'), ('video','ancona'), ('video','bari'), ('video','bologna'),
  ('video','brescia'), ('video','caserta'), ('video','catania'), ('video','cosenza'), ('video','ferrara'), ('video','forli-cesena'),
  ('video','lecce'), ('video','lucca'), ('video','modena'), ('video','monza-e-della-brianza'), ('video','napoli'), ('video','padova'),
  ('video','palermo'), ('video','parma'), ('video','pesaro-e-urbino'), ('video','pescara'), ('video','piacenza'), ('video','pisa'),
  ('video','pistoia'), ('video','reggio-emilia'), ('video','torino'), ('video','trento'), ('video','treviso'), ('video','udine'),
  ('video','varese'), ('video','venezia'), ('video','verona'), ('video','vicenza'), ('web-agency','ancona'), ('web-agency','arezzo'),
  ('web-agency','biella'), ('web-agency','bologna'), ('web-agency','bolzano'), ('web-agency','brescia'), ('web-agency','cagliari'), ('web-agency','caserta'),
  ('web-agency','catania'), ('web-agency','cuneo'), ('web-agency','ferrara'), ('web-agency','firenze'), ('web-agency','lucca'), ('web-agency','milano'),
  ('web-agency','modena'), ('web-agency','monza-e-della-brianza'), ('web-agency','padova'), ('web-agency','palermo'), ('web-agency','parma'), ('web-agency','perugia'),
  ('web-agency','pesaro-e-urbino'), ('web-agency','pescara'), ('web-agency','pisa'), ('web-agency','ravenna'), ('web-agency','rimini'), ('web-agency','roma'),
  ('web-agency','salerno'), ('web-agency','sassari'), ('web-agency','siena'), ('web-agency','torino'), ('web-agency','trento'), ('web-agency','venezia'),
  ('web-agency','verona'), ('web-agency','vicenza');

-- Si ferma se una competenza o una città non esiste: meglio un errore che una combo persa in silenzio.
do $$
declare mancanti text;
begin
  select string_agg(c.skill_slug || '|' || c.area_slug, ', ') into mancanti
  from combo_live c
  left join agency_skills s on s.slug = c.skill_slug
    and s.domain_id = (select id from network_domains where domain = 'miglioreagenzia.it')
  left join areas a on a.slug = c.area_slug and a.tipo = 'citta' and a.domain_id = s.domain_id
  where s.id is null or a.id is null;
  if mancanti is not null then
    raise exception 'Combo non trovate: %', mancanti;
  end if;
end $$;

insert into combo_whitelist (domain_id, skill_id, area_id, motivo)
select s.domain_id, s.id, a.id, 'pubblica sul live con impression GSC (24/11/2026)'
from combo_live c
join agency_skills s on s.slug = c.skill_slug
  and s.domain_id = (select id from network_domains where domain = 'miglioreagenzia.it')
join areas a on a.slug = c.area_slug and a.tipo = 'citta' and a.domain_id = s.domain_id
on conflict (domain_id, skill_id, area_id) do nothing;

select count(*) as combo_in_whitelist from combo_whitelist;

commit;
