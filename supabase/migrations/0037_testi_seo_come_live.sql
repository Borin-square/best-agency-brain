-- 0037 — Testi SEO identici al live per la messa online.
--
-- Decisione del 17/11/2026: il sito nuovo va online con title, H1 e description uguali a quelli
-- indicizzati dal vecchio WordPress, e le correzioni di forma arrivano 4–8 settimane dopo, come passo
-- separato e misurabile in Search Console. Cambiare testi e tecnologia insieme renderebbe
-- impossibile capire la causa di un eventuale calo.
--
-- Rimette quindi:
--   - agency_skills.seo_definition: le definizioni che il live usa davvero (calcolate con
--     mg_competenza_definizione() del tema: campo vuoto → "le migliori agenzie di {Nome}", tranne
--     web-agency). Le forme ritoccate della 0032 ("le migliori agenzie SEO"...) sono annotate in
--     docs/rebuild.md del sito, da rimettere dal campo "Definizione SEO" della pagina competenze.
--   - areas.luogo di 4 aree: "in Lazio", "in Marche", "a La Spezia", "a L'Aquila" come sul live
--     (corrette il 10/11 in "nel Lazio", "nelle Marche", "alla Spezia", "all'Aquila").
--     luogo serve solo ai testi: il riconoscimento delle aree (aree_da_testo) usa nome e alias.
--
-- woocommerce non esiste sul live e resta com'è. Rieseguibile.

do $$
declare
  dominio uuid := (select id from public.network_domains where domain = 'miglioreagenzia.it');
begin
  update public.agency_skills s
  set seo_definition = v.def
  from (values
    ('amazon-marketing',       'le migliori agenzie di Amazon Marketing'),
    ('branding',               'le migliori agenzie di Branding'),
    ('comunicazione',          'le migliori agenzie di Comunicazione'),
    ('digital-pr',             'le migliori agenzie di Digital PR'),
    ('e-commerce',             'le migliori agenzie di E-commerce'),
    ('e-mail-marketing',       'le migliori agenzie di Email Marketing'),
    ('eventi',                 'le migliori agenzie di Eventi'),
    ('fotografia',             'le migliori agenzie di Fotografia'),
    ('google-ads',             'le migliori agenzie di Google Ads'),
    ('grafica',                'le migliori agenzie di Grafica'),
    ('influencer-marketing',   'le migliori agenzie di Influencer Marketing'),
    ('lead-generation',        'le migliori agenzie di Lead generation'),
    ('magento',                'le migliori agenzie di Magento'),
    ('marketing',              'le migliori agenzie di Marketing'),
    ('prestashop',             'le migliori agenzie di Prestashop'),
    ('pubbliche-relazioni',    'le migliori agenzie di Pubbliche Relazioni'),
    ('pubblicita',             'le migliori agenzie di Pubblicità'),
    ('seo',                    'le migliori agenzie di SEO'),
    ('shopify',                'le migliori agenzie di Shopify'),
    ('social-media',           'le migliori agenzie di Social Media'),
    ('strategia-di-contenuto', 'le migliori agenzie di Strategia Di Contenuto'),
    ('video',                  'le migliori agenzie di Video'),
    ('web-agency',             'Le migliori Web Agency'),
    ('wordpress',              'le migliori agenzie di Wordpress')
  ) as v(slug, def)
  where s.slug = v.slug and s.domain_id = dominio;

  update public.areas a
  set luogo = v.luogo
  from (values
    ('lazio',     'in Lazio'),
    ('marche',    'in Marche'),
    ('la-spezia', 'a La Spezia'),
    ('laquila',   'a L''Aquila')
  ) as v(slug, luogo)
  where a.slug = v.slug and a.domain_id = dominio;
end $$;

-- Controllo: 24 competenze e 4 aree con il testo del live.
select
  (select count(*) from public.agency_skills s
   join public.network_domains d on d.id = s.domain_id and d.domain = 'miglioreagenzia.it'
   where s.seo_definition like 'le migliori agenzie di %' or s.seo_definition = 'Le migliori Web Agency') as competenze_come_live,
  (select count(*) from public.areas a
   join public.network_domains d on d.id = a.domain_id and d.domain = 'miglioreagenzia.it'
   where (a.slug, a.luogo) in (('lazio', 'in Lazio'), ('marche', 'in Marche'), ('la-spezia', 'a La Spezia'), ('laquila', 'a L''Aquila'))) as aree_come_live;
