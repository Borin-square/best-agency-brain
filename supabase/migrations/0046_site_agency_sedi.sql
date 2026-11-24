-- Vista site.agency_sedi: le sedi delle agenzie pubblicate, per la scheda del sito
-- (docs/sedi-progetto.md).
--
-- Una riga per sede, la principale per prima (ordine = 1), poi le altre italiane per comune e infine
-- quelle estere.
--
-- Tre casi:
--   - sede italiana completa: comune, sigla, provincia e regione;
--   - sede italiana "da completare" (completa = false): solo provincia e regione, niente comune e
--     niente indirizzo. Restano finché non si sceglie il comune dalla scheda del brain;
--   - sede estera: paese (codice ISO a due lettere) e citta_estera. Non ha provincia né regione e non
--     conta negli archivi: solo dato da mostrare.
--
-- `etichetta` è il testo pronto da mostrare:
--   "Cinisello Balsamo (MI)" · "Provincia di Padova" · "Lugano"
-- Per le sedi estere il nome del paese lo ricava il sito dal codice
-- (Intl.DisplayNames('it', { type: 'region' })).
--
-- Le coordinate per la mappa restano su site.agencies (lat, lng): un solo pin per agenzia.

create or replace view site.agency_sedi as
select
  s.agency_id,
  s.id                                   as sede_id,
  row_number() over (
    partition by s.agency_id
    order by s.principale desc, (s.paese = 'IT') desc, c.nome nulls last, p.nome, s.citta_estera, s.id
  )::int                                 as ordine,
  s.principale,
  s.paese,
  (s.paese <> 'IT' or s.comune_codice is not null) as completa,
  c.nome                                 as comune,
  c.sigla                                as sigla,
  p.slug                                 as provincia_slug,
  p.nome                                 as provincia,
  r.slug                                 as regione_slug,
  r.nome                                 as regione,
  s.citta_estera,
  s.indirizzo,
  case
    when s.paese <> 'IT'            then s.citta_estera
    when s.comune_codice is not null then c.nome || coalesce(' (' || c.sigla || ')', '')
    else 'Provincia di ' || p.nome
  end                                    as etichetta
from public.agency_sedi s
join public.agencies g on g.id = s.agency_id and g.publish_status = 'publish'
left join public.comuni c on c.codice = s.comune_codice
left join public.areas p on p.id = s.area_id
left join public.areas r on r.id = p.parent_id;

revoke all on site.agency_sedi from public, anon, authenticated;
grant select on site.agency_sedi to site_reader;
