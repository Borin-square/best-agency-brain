-- =====================================================================
-- 0029_public_slug.sql
--   agencies.public_slug: lo slug dell'URL pubblico /agenzia/{slug}/.
--   - Riempito una volta, per le agenzie publish, con lo slug del live
--     (WordPress, letto via WP-CLI il 10/11/2026).
--   - Per le agenzie pubblicate dopo, lo genera un trigger al momento
--     della pubblicazione.
--   - Una volta assegnato non cambia più: un URL indicizzato non si sposta.
-- `slug` resta l'identificativo interno del brain (con il suffisso -{wp_id}).
-- =====================================================================

alter table public.agencies add column if not exists public_slug text;

create unique index if not exists agencies_public_slug_uniq
  on public.agencies (domain_id, public_slug)
  where public_slug is not null;

-- ---- Generazione per le agenzie nuove ----------------------------------
-- Dallo slug del brain senza "-{wp_id}" se c'è, altrimenti dal titolo.
-- Se lo slug è già preso nel dominio aggiunge -2, -3...
create or replace function public.genera_public_slug(
  p_domain_id uuid, p_agency_id uuid, p_slug text, p_wp_id integer, p_title text)
returns text
language plpgsql
stable
as $$
declare
  base      text;
  candidato text;
  n         integer := 1;
begin
  if p_wp_id is not null and p_slug like '%-' || p_wp_id then
    base := left(p_slug, length(p_slug) - length('-' || p_wp_id));
  else
    base := replace(public.normalizza_luogo(p_title), ' ', '-');
  end if;
  if coalesce(base, '') = '' then
    base := 'agenzia';
  end if;

  candidato := base;
  while exists (
    select 1 from public.agencies
    where domain_id = p_domain_id and public_slug = candidato and id <> p_agency_id
  ) loop
    n := n + 1;
    candidato := base || '-' || n;
  end loop;
  return candidato;
end
$$;

create or replace function public.agencies_public_slug()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.public_slug is not null
     and new.public_slug is distinct from old.public_slug then
    raise exception 'public_slug di % non si cambia (era %, nuovo %): serve un redirect, non una modifica',
      new.id, old.public_slug, new.public_slug;
  end if;

  if new.public_slug is null and new.publish_status = 'publish' then
    new.public_slug := public.genera_public_slug(new.domain_id, new.id, new.slug, new.wp_id, new.title);
  end if;
  return new;
end
$$;

drop trigger if exists agencies_public_slug on public.agencies;
create trigger agencies_public_slug
  before insert or update of public_slug, publish_status on public.agencies
  for each row
  execute function public.agencies_public_slug();

revoke execute on function public.agencies_public_slug() from public, anon, authenticated;

-- ---- Riempimento iniziale ----------------------------------------------
-- Tutto in un solo blocco: se qualcosa fallisce si annulla per intero.
-- Il trigger di updated_at resta sospeso durante il riempimento perché
-- l'agente agency-quality-check sceglie le agenzie da controllare partendo
-- dall'updated_at più vecchio: aggiornarlo su tutte ne cambierebbe l'ordine.
--
-- Prima le schede il cui slug sul live non segue la regola (punteggiatura
-- e apostrofi tolti da WordPress in modo diverso dal brain) e le tre senza
-- wp_id, agganciate per uuid (sul live id_vercel = id del brain).
-- Le tre con l'emoji nello slug del live (%e2%9c%94-dgnet, be%c2%b2brand,
-- %e2%96%b7-webagentur-sudtirol) seguono invece la regola: prendono lo
-- slug pulito e il vecchio URL andrà in agency_redirects.
do $$
declare
  dominio uuid := (select id from public.network_domains where domain = 'miglioreagenzia.it');
  r record;
begin
  alter table public.agencies disable trigger agencies_set_updated_at;

  update public.agencies a
  set public_slug = e.public_slug
  from (values
    (1300, null::uuid, 'agrellibasta'),
    (1497, null, 'brandsoda'),
    (1408, null, 'damico-graphic-studio'),
    (1760, null, 'designmultimedia'),
    (852, null, 'hs'),
    (652, null, 'jets'),
    (872, null, 'larancia'),
    (403, null, 'mecpartners'),
    (1849, null, 'mugeles-brand-identity'),
    (1184, null, 'qb'),
    (437, null, 'redblue'),
    (1233, null, 'trb-group'),
    (510, null, 'upup'),
    (null, '86fdb85b-875b-4e10-b28d-361bcf93eda1', 'copiaincolla'),
    (null, '989eff2a-dbb1-4f41-9dbf-9b267325c835', 'to-get'),
    (null, '89a79d06-b551-4163-980a-8f37ab91dd1a', 'virality-solution-2')
  ) as e(wp_id, agency_id, public_slug)
  where a.domain_id = dominio
    and a.public_slug is null
    and (a.wp_id = e.wp_id or a.id = e.agency_id);

  -- Poi tutte le altre publish, con la regola. Riga per riga, così ogni
  -- slug vede quelli già assegnati (genera_public_slug evita i doppioni).
  for r in
    select id, domain_id, slug, wp_id, title
    from public.agencies
    where publish_status = 'publish' and public_slug is null
    order by wp_id nulls last, created_at
  loop
    update public.agencies
    set public_slug = public.genera_public_slug(r.domain_id, r.id, r.slug, r.wp_id, r.title)
    where id = r.id;
  end loop;

  alter table public.agencies enable trigger agencies_set_updated_at;
end
$$;

-- ---- Vista per il sito -------------------------------------------------
-- create or replace view può solo aggiungere colonne in fondo.
create or replace view site.agencies as
select
  a.id,
  a.domain_id,
  a.wp_id,
  a.slug,
  a.title,
  a.content,
  a.descrizione_breve,
  a.editorial_summary,
  a.seo_title,
  a.meta_description,
  a.indexation_status,
  a.competenze_core,
  a.competenze_principali,
  a.altre_competenze,
  a.pillar_primario_slug,
  a.caratteristiche,
  a.aree,
  a.citta,
  a.regioni,
  a.lat,
  a.lng,
  case when nullif(trim(a.google_sito), '') is not null and a.match_confidence >= 0.8
       then trim(a.google_sito) else nullif(trim(a.sito_web), '') end as sito,
  case when nullif(trim(a.google_telefono), '') is not null and a.match_confidence >= 0.8
       then trim(a.google_telefono) else nullif(trim(a.telefono), '') end as telefono,
  case when nullif(trim(a.google_indirizzo), '') is not null and a.match_confidence >= 0.8
       then trim(a.google_indirizzo) else nullif(trim(a.indirizzo_completo), '') end as indirizzo,
  nullif(trim(a.email), '') is not null as ha_email,
  a.linkedin,
  a.instagram,
  a.behance,
  a.google_rating::float8 as google_rating,
  a.google_recensioni_count,
  a.google_categoria,
  a.google_place_id,
  a.logo_url,
  a.logo_meta,
  a.foto_del_team,
  a.photos,
  a.portfolio,
  a.case_studies,
  a.google_partner_cert,
  a.anno_di_fondazione,
  a.incorporation_year,
  a.dimensione_team,
  a.lingue,
  a.fascia_di_prezzo,
  a.min_project_budget,
  a.min_project_currency,
  a.typical_project_min,
  a.typical_project_max,
  a.pricing_models,
  a.engagement_models,
  a.ideal_client_sizes,
  a.deliverables,
  a.platforms_tech,
  a.industries,
  a.audiences,
  a.alternate_names,
  a.parent_slug,
  a.differentiators,
  a.declared_methodology,
  a.faq,
  a.best_for,
  a.less_suitable_for,
  a.review_summary,
  a.review_strengths,
  a.review_criticisms,
  a.review_analyzed_count,
  a.review_snapshot_date,
  a.eval_strengths,
  a.eval_limitations,
  a.evidence_grade,
  a.evaluation_confidence,
  a.human_reviewed,
  a.verifica,
  a.status_curatela,
  a.created_at,
  a.updated_at,
  a.public_slug
from public.agencies a
where a.publish_status = 'publish';
