-- Schema `site`: viste in sola lettura per il sito pubblico (miglioreagenzia.it e futuri domini).
-- Il sito legge solo da qui, con il ruolo `site_reader`; mai dalle tabelle di `public`.
--
-- Le viste girano con i permessi del proprietario (postgres), quindi non passano dalla RLS delle
-- tabelle: il filtro su cosa è pubblico sta tutto nelle colonne e nelle WHERE qui sotto.
-- `site` non va aggiunto agli "Exposed schemas" dell'API: anon e authenticated non lo vedono.
--
-- Il ruolo nasce senza login. La password si imposta a mano dall'SQL Editor, mai in una migrazione:
--   alter role site_reader with login password '...';

create schema if not exists site;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'site_reader') then
    create role site_reader nologin;
  end if;
end
$$;

create or replace view site.domains as
select id, domain, country_code, country_name, status, launch_date, starred_areas
from public.network_domains;

-- Solo agenzie publish. Esclusi: email e telefono grezzi, P.IVA, dati di bilancio, note del
-- curatore e tutti i campi interni degli agenti (enrichment, serp, quality gate, manual_fields).
--
-- Sito, telefono e indirizzo: comanda Google quando il match è affidabile (match_confidence
-- >= 0.8, stessa soglia del tema WordPress); sotto soglia il dato Google può essere di un'altra
-- azienda e si ripiega sul campo dell'agenzia. Dell'email passa solo la presenza, per il ranking.
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
  a.google_rating::float8 as google_rating, -- numeric arriva ai client JS come stringa
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
  a.updated_at
from public.agencies a
where a.publish_status = 'publish';

create or replace view site.skills as
select domain_id, slug, label, sort_order, query_modifier, descrizione, faq, guide_correlate
from public.agency_skills;

-- Solo le posizioni Featured di agenzie pubblicate.
create or replace view site.features as
select f.agency_id, f.area_type, f.area_slug, f.skill_slug, f.sort_order
from public.agency_features f
join public.agencies a on a.id = f.agency_id and a.publish_status = 'publish';

revoke all on schema site from public, anon, authenticated;
revoke all on all tables in schema site from public, anon, authenticated;

grant usage on schema site to site_reader;
grant select on all tables in schema site to site_reader;
