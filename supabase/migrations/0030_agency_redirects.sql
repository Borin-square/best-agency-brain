-- =====================================================================
-- 0030_agency_redirects.sql
--   Cosa rispondono i vecchi URL delle schede /agenzia/{slug}/ che non
--   corrispondono più a un'agenzia pubblicata:
--   - 301 verso la scheda indicata in target_agency_id, se è publish;
--   - 410 (tolta apposta) se target_agency_id è vuoto o non è publish.
--   Riempita una volta con le schede cancellate dal live e gli slug con
--   caratteri speciali; poi la tiene aggiornata un trigger su agencies:
--   una scheda che esce da publish (o viene eliminata) aggiunge il suo 410,
--   una scheda che torna publish lo toglie.
-- Gli slug si salvano decodificati (▷-a5-studio, non %e2%96%b7-a5-studio):
-- il sito decodifica l'URL prima di confrontarlo.
-- =====================================================================

create table if not exists public.agency_redirects (
  domain_id        uuid not null references public.network_domains(id) on delete cascade,
  old_slug         text not null,
  -- Il bersaglio è l'agenzia, non il suo slug: se in futuro viene tolta
  -- anche lei, il redirect diventa da solo un 410 invece di una catena.
  target_agency_id uuid references public.agencies(id) on delete set null,
  motivo           text not null,
  created_at       timestamptz not null default now(),
  primary key (domain_id, old_slug)
);

alter table public.agency_redirects enable row level security;
revoke all on public.agency_redirects from anon, authenticated;

-- ---- Trigger su agencies -----------------------------------------------
-- after: il trigger di public_slug (before) ha già assegnato lo slug.
-- security definer: chi scrive su agencies (service role, dashboard)
-- aggiorna la tabella anche senza permessi diretti su di essa.
create or replace function public.agencies_redirects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.publish_status = 'publish' and old.public_slug is not null then
      insert into public.agency_redirects (domain_id, old_slug, motivo)
      values (old.domain_id, old.public_slug, 'scheda eliminata dal brain')
      on conflict do nothing;
    end if;
    return old;
  end if;

  if new.public_slug is null then
    return new;
  end if;

  if new.publish_status = 'publish' then
    -- Lo slug torna a essere una scheda viva: nessun redirect su di lui.
    delete from public.agency_redirects
    where domain_id = new.domain_id and old_slug = new.public_slug;
  elsif tg_op = 'UPDATE' and old.publish_status = 'publish' then
    insert into public.agency_redirects (domain_id, old_slug, motivo)
    values (new.domain_id, new.public_slug, 'scheda tolta da publish (' || new.publish_status || ')')
    on conflict do nothing;
  end if;
  return new;
end
$$;

drop trigger if exists agencies_redirects on public.agencies;
create trigger agencies_redirects
  after insert or update of publish_status, public_slug or delete on public.agencies
  for each row
  execute function public.agencies_redirects();

revoke execute on function public.agencies_redirects() from public, anon, authenticated;

-- ---- Riempimento iniziale ----------------------------------------------
do $$
declare
  dominio uuid := (select id from public.network_domains where domain = 'miglioreagenzia.it');
begin
  -- Slug del live con caratteri speciali: la scheda sul brain ha lo slug
  -- pulito (0029), il vecchio URL fa 301. Agganciate per wp_id.
  insert into public.agency_redirects (domain_id, old_slug, target_agency_id, motivo)
  select dominio, e.old_slug, a.id, 'slug del live con caratteri speciali'
  from (values
    ('✔-dgnet', 1447),
    ('be²brand', 273),
    ('▷-webagentur-sudtirol', 1956)
  ) as e(old_slug, wp_id)
  join public.agencies a on a.domain_id = dominio and a.wp_id = e.wp_id
  on conflict do nothing;

  -- Schede cancellate dal live il 6/11/2026 perché fuori target (224, fra
  -- cui le 45 già eliminate o cestinate sul brain il 3/11), più
  -- migliore-agenzia: un sito concorrente, publish sul live ma non sul brain.
  insert into public.agency_redirects (domain_id, old_slug, motivo)
  select dominio, e.old_slug, 'cancellata dal live il 6/11/2026'
  from (values
    ('23-digital'), ('abaroma'), ('adami-associati'), ('adc-group'), ('adlinko-os'), ('agenzia-a-italia'),
    ('agenzia-comunicazione-torino'), ('agenzia-gioventu'), ('agenzia-kids'), ('agenzia-piu'), ('agenziapubblicitariaaffronti'), ('aldo-agostinelli'),
    ('aleide'), ('alessianonsolografica'), ('andrea-nardoni'), ('andreasardo'), ('apg'), ('aq'),
    ('area'), ('aret-agenziapugliapromozione-it'), ('aret-aret-regione-puglia-it'), ('arezzo-digitale'), ('aruba'), ('associato'),
    ('ateacme'), ('atelier790'), ('baby-fashion'), ('baldassarri'), ('bea'), ('behance'),
    ('belfatto-lab'), ('belmond'), ('best-all'), ('blog-buzzoole'), ('bluvacanze'), ('bologna-convention-bureau'),
    ('bottegaeditoriale'), ('brand-news'), ('branded-podcast-italia'), ('bruceclay'), ('caesar-tour'), ('camcom'),
    ('canellacamaiora'), ('choruslife'), ('coalitiontechnologies'), ('confindustriacaserta'), ('consulenza-certificazioni-aziendali'), ('controverso'),
    ('convention-bureau-padova'), ('copy42'), ('copywriting-efficace'), ('corrierepeligno'), ('corsi-seo-online'), ('corsidia'),
    ('creathead'), ('creazione-ecommerce'), ('crispi77'), ('cronoshare'), ('cruciverba-io'), ('cruciverba-parole-crociate'),
    ('csvabruzzo'), ('cyber-security-360'), ('d-com'), ('data'), ('deda-digital'), ('digidentity-agency'),
    ('diginetica-bologna'), ('digital-agency-network'), ('digital-coach'), ('digital-marketing-blog'), ('dimora-storica-bergamo'), ('dizy'),
    ('dotcom'), ('eastsideco'), ('easy-tech-group'), ('ecommercefarmacie'), ('ecommercewebdesign'), ('edenviaggi'),
    ('edilportale'), ('emme-media'), ('emmecubo-agenzia-web-marketing-treviso-emmecubo-it'), ('engage'), ('eventeria'), ('eventi-e-occupazioni'),
    ('expedia'), ('fdrk'), ('fedros-eventi'), ('feiyr'), ('fiscooggi'), ('flawless-life'),
    ('flazio-experience'), ('freshcontentsociety'), ('friuli-venezia-giulia'), ('garanteprivacy'), ('gianpietro-vigorelli'), ('goat-seo'),
    ('gust-comunicazione-gustcomunicazione-it'), ('gust-comunicazione-iriscomunicazione-it'), ('ice'), ('ict-sviluppo'), ('ignas'), ('il-centro'),
    ('ilas'), ('immagina-group'), ('indirizzo-via-biglieri-10'), ('influencee'), ('innova'), ('inside-marketing'),
    ('italia-in-digitale'), ('italia-non-profit'), ('jooble'), ('keli-web'), ('la-mia-liguria'), ('lamanageragency'),
    ('landingi'), ('laquila-blog'), ('lastminute'), ('laterradelgusto'), ('lavorare-come-promoter'), ('lets'),
    ('link2me'), ('livearts'), ('luiss'), ('luissthesis'), ('luxury-events-milano'), ('magnific'),
    ('manzoni16'), ('marketing-tochina'), ('mayanprojects'), ('mc-blog'), ('mediaticanetwork'), ('merchandising'),
    ('mianonnanonlocapisce'), ('music-caffeina'), ('musicaemergenti'), ('mysocialbusiness'), ('neventum'), ('nexus-design-sagl'),
    ('novawave'), ('novenovepi'), ('ogp-comunicazione'), ('opera-digital-e'), ('or-bit-media'), ('paoloroversi'),
    ('pharmacyscanner'), ('portaledeigiovani'), ('provincia-di-chieti'), ('publia'), ('publyswiss'), ('pugliapromozione-bari'),
    ('pugliapromozione-bologna'), ('puntocasting'), ('quadrato'), ('qualifier'), ('radio-promoter'), ('radiopromoter'),
    ('raizen'), ('register'), ('registrodelleopposizioni'), ('reportaziende'), ('reteimprese'), ('risorse'),
    ('roberto-mantovani'), ('rolling-stone-italia'), ('salesflare-blog'), ('scoprendo-la-puglia'), ('scuola-grafica'), ('search-advertising'),
    ('seedingup'), ('seo'), ('seo-digital'), ('seo-zoom'), ('servizi-confindustria-bergamo'), ('shock-wave'),
    ('shopify-plus-agency'), ('sinergicaservizi'), ('skeepers'), ('social-academy'), ('social-tech'), ('somewhere'),
    ('stampa-online-personalizzata'), ('starofservice'), ('studio-d'), ('sulmonalive'), ('superside'), ('supporthost'),
    ('taliaweb'), ('teamcetu'), ('theta-adv'), ('thrive-agency'), ('tob-events'), ('toscanapromozione'),
    ('trade-s-r-l'), ('trade-srl'), ('trevisobellunosystem'), ('tripadvisor'), ('udinetoday'), ('ufficiocamerale'),
    ('una'), ('unibg'), ('unidformazione'), ('unimc'), ('universita-telematica-unicusano'), ('varese-news'),
    ('via-lodivecchio-37-39'), ('viaggiare-da-soci'), ('villa-renoir-ristorante'), ('villaggio-musicale'), ('virality-solution'), ('visit-sulmona'),
    ('visitferrara'), ('volantinaggio-torino'), ('voyage-prive'), ('wearemad-media'), ('web-marketing-bologna'), ('webagency-adv-isor'),
    ('webagency-town'), ('wecanjob'), ('welcome-dms-puglia-it'), ('welcome-spot-agenziapugliapromozione-it'), ('work-in-progress'), ('youmark'),
    ('zazoom-social-news'), ('▷-a5-studio')
  ) as e(old_slug)
  -- Per sicurezza: mai un 410 su uno slug che oggi è una scheda pubblicata.
  where not exists (
    select 1 from public.agencies a
    where a.domain_id = dominio and a.public_slug = e.old_slug and a.publish_status = 'publish'
  )
  on conflict do nothing;

  insert into public.agency_redirects (domain_id, old_slug, motivo)
  values (dominio, 'migliore-agenzia', 'sito concorrente, non un''agenzia')
  on conflict do nothing;
end
$$;

-- ---- Vista per il sito -------------------------------------------------
-- new_slug è valorizzato solo se il bersaglio è publish: altrimenti 410.
create or replace view site.agency_redirects as
select
  r.domain_id,
  r.old_slug,
  t.public_slug as new_slug,
  case when t.id is not null then 301 else 410 end as status
from public.agency_redirects r
left join public.agencies t
  on t.id = r.target_agency_id and t.publish_status = 'publish';

revoke all on site.agency_redirects from public, anon, authenticated;
grant select on site.agency_redirects to site_reader;
