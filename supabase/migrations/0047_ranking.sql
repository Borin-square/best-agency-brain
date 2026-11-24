-- Ranking degli elenchi calcolato nel brain (prima lo calcolava il sito in src/lib/dati/ranking.ts).
--
-- Stessa logica del sito, che a sua volta riprende la fase 1 del ranking del live:
--   punteggio = Servizi × peso_servizi + Completezza × peso_completezza
-- con i pesi del tipo di pagina. Gli elenchi si ordinano per punteggio decrescente; a pari punteggio
-- l'ordine resta del sito: wp_id decrescente (le agenzie senza wp_id prima), poi titolo.
--
-- I pesi sono interi: 35/10 al posto di 35/45 e 10/45. L'ordine è identico (si divide tutto per la
-- stessa costante), e i pareggi restano pareggi esatti invece di dipendere dagli arrotondamenti.
--
-- Servizi (per una competenza): 100 se è fra le core, 60 fra le principali, 30 fra le altre.
--   Nelle pagine di area (e nell'archivio) conta la migliore fra le competenze dell'agenzia, 0 se
--   non ne ha.
-- Completezza (0-100), sui dati che il sito mostra (site.agencies):
--   logo 10 · descrizione breve o testo (senza tag) oltre 200 caratteri 15 · sito 10 · email 5 ·
--   telefono 5 · dimensione team 5 · almeno una competenza del vocabolario 10.
--   È la completezza del sito, non quella della scheda del brain (src/lib/agency-score.ts, che conta
--   anche foto, portfolio e case study): unificarle cambierebbe l'ordine, è una decisione a parte.
--
-- Il trim e la lunghezza imitano JavaScript (spazi Unicode compresi, i caratteri fuori dal BMP
-- contano 2), così il punteggio coincide con quello che calcolava il sito.
--
-- Cosa crea:
--   - public.ranking_config: pesi e punti per dominio, modificabili dal brain;
--   - public.agency_punteggi: punteggi di tutte le agenzie (anche bozze), per il brain e il CRM;
--   - site.agency_punteggi: solo le pubblicate, per il sito. Una riga per agenzia e tipo di pagina:
--       tipo 'area'       → skill_slug null (vale anche per l'archivio /agenzie/)
--       tipo 'competenza' → una riga per competenza dell'agenzia
--       tipo 'combo'      → una riga per competenza dell'agenzia
--       tipo 'competenza' e 'combo' con skill_slug '*' → il punteggio per una competenza che
--         l'agenzia NON ha. Capita solo con un filtro scritto a mano su un altro asse
--         (/seo/?f_competenza[]=social): il live dava 63 punti Servizi ("competenza senza fascia"),
--         più di una principale. Riprodotto per avere lo stesso ordine; da rivedere (punti_assente).

-- ---- 1. Pesi ----------------------------------------------------------------
create table if not exists public.ranking_config (
  domain_id               uuid primary key references public.network_domains(id) on delete cascade,
  punti_core              int not null default 100 check (punti_core >= 0),
  punti_principali        int not null default 60  check (punti_principali >= 0),
  punti_altre             int not null default 30  check (punti_altre >= 0),
  punti_assente           int not null default 63  check (punti_assente >= 0),
  competenza_servizi      int not null default 40  check (competenza_servizi >= 0),
  competenza_completezza  int not null default 15  check (competenza_completezza >= 0),
  combo_servizi           int not null default 35  check (combo_servizi >= 0),
  combo_completezza       int not null default 10  check (combo_completezza >= 0),
  area_servizi            int not null default 20  check (area_servizi >= 0),
  area_completezza        int not null default 15  check (area_completezza >= 0),
  updated_at              timestamptz not null default now()
);

comment on table public.ranking_config is
  'Pesi del ranking degli elenchi del sito, per dominio (migrazione 0047). Punteggio = Servizi × peso servizi + Completezza × peso completezza del tipo di pagina.';

insert into public.ranking_config (domain_id)
select id from public.network_domains
on conflict (domain_id) do nothing;

alter table public.ranking_config enable row level security;
revoke all on public.ranking_config from anon, authenticated;

-- L'utente di sola lettura per le analisi (brain_ro), se esiste, legge anche questa tabella.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'brain_ro')
     and not exists (select 1 from pg_policies where tablename = 'ranking_config' and policyname = 'brain_ro_select') then
    create policy brain_ro_select on public.ranking_config for select to brain_ro using (true);
  end if;
end $$;

-- ---- 2. Punteggi di tutte le agenzie ------------------------------------------
create or replace view public.agency_punteggi as
with base as (
  select
    a.id as agency_id,
    a.domain_id,
    a.publish_status,
    a.competenze_core,
    a.competenze_principali,
    a.altre_competenze,
    -- Stessi valori di site.agencies (sito e telefono di Google se il match è affidabile).
    case
      when nullif(trim(a.google_sito), '') is not null and a.match_confidence >= 0.8 then trim(a.google_sito)
      else nullif(trim(a.sito_web), '')
    end as sito,
    case
      when nullif(trim(a.google_telefono), '') is not null and a.match_confidence >= 0.8 then trim(a.google_telefono)
      else nullif(trim(a.telefono), '')
    end as telefono,
    nullif(trim(a.email), '') is not null as ha_email,
    a.logo_url,
    a.descrizione_breve,
    regexp_replace(coalesce(a.content, ''), '<[^>]+>', '', 'g') as testo,
    a.dimensione_team,
    array(
      select distinct s.slug
      from unnest(coalesce(a.competenze_core, '{}') || coalesce(a.competenze_principali, '{}')
                  || coalesce(a.altre_competenze, '{}')) as c(slug)
      join public.agency_skills s on s.slug = c.slug and s.domain_id = a.domain_id
    ) as competenze
  from public.agencies a
),
-- Trim come String.prototype.trim di JavaScript.
pulito as (
  select b.*,
    regexp_replace(coalesce(b.logo_url, ''),
      '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$', '', 'g') as t_logo,
    regexp_replace(coalesce(b.descrizione_breve, ''),
      '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$', '', 'g') as t_descr,
    regexp_replace(b.testo,
      '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$', '', 'g') as t_testo,
    regexp_replace(coalesce(b.sito, ''),
      '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$', '', 'g') as t_sito,
    regexp_replace(coalesce(b.telefono, ''),
      '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$', '', 'g') as t_telefono,
    regexp_replace(coalesce(b.dimensione_team, ''),
      '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$', '', 'g') as t_team
  from base b
),
completezza as (
  select p.*,
    least(100,
        case when p.t_logo <> '' then 10 else 0 end
      -- Lunghezza come in JavaScript: i caratteri fuori dal BMP (emoji) contano 2.
      + case when length(p.t_descr) + length(regexp_replace(p.t_descr, '[^\U00010000-\U0010FFFF]', '', 'g')) > 200
               or length(p.t_testo) + length(regexp_replace(p.t_testo, '[^\U00010000-\U0010FFFF]', '', 'g')) > 200
             then 15 else 0 end
      + case when p.t_sito <> '' then 10 else 0 end
      + case when p.ha_email then 5 else 0 end
      + case when p.t_telefono <> '' then 5 else 0 end
      + case when p.t_team <> '' then 5 else 0 end
      + case when cardinality(p.competenze) > 0 then 10 else 0 end
    ) as completezza
  from pulito p
),
servizi as (
  select c.agency_id, s.slug as skill_slug,
    case
      when s.slug = any(coalesce(c.competenze_core, '{}'))       then r.punti_core
      when s.slug = any(coalesce(c.competenze_principali, '{}')) then r.punti_principali
      when s.slug = any(coalesce(c.altre_competenze, '{}'))      then r.punti_altre
    end as servizi
  from completezza c
  join public.ranking_config r on r.domain_id = c.domain_id
  cross join lateral unnest(c.competenze) as s(slug)
)
-- Pagine di area e archivio: la migliore competenza dell'agenzia (0 se non ne ha).
select c.agency_id, c.domain_id, c.publish_status, 'area'::text as tipo, null::text as skill_slug,
       coalesce((select max(sv.servizi) from servizi sv where sv.agency_id = c.agency_id), 0) as servizi,
       c.completezza,
       coalesce((select max(sv.servizi) from servizi sv where sv.agency_id = c.agency_id), 0) * r.area_servizi
         + c.completezza * r.area_completezza as punteggio
from completezza c
join public.ranking_config r on r.domain_id = c.domain_id
union all
select c.agency_id, c.domain_id, c.publish_status, 'competenza', sv.skill_slug, sv.servizi, c.completezza,
       sv.servizi * r.competenza_servizi + c.completezza * r.competenza_completezza
from completezza c
join public.ranking_config r on r.domain_id = c.domain_id
join servizi sv on sv.agency_id = c.agency_id
union all
select c.agency_id, c.domain_id, c.publish_status, 'combo', sv.skill_slug, sv.servizi, c.completezza,
       sv.servizi * r.combo_servizi + c.completezza * r.combo_completezza
from completezza c
join public.ranking_config r on r.domain_id = c.domain_id
join servizi sv on sv.agency_id = c.agency_id
union all
select c.agency_id, c.domain_id, c.publish_status, 'competenza', '*', r.punti_assente, c.completezza,
       r.punti_assente * r.competenza_servizi + c.completezza * r.competenza_completezza
from completezza c
join public.ranking_config r on r.domain_id = c.domain_id
union all
select c.agency_id, c.domain_id, c.publish_status, 'combo', '*', r.punti_assente, c.completezza,
       r.punti_assente * r.combo_servizi + c.completezza * r.combo_completezza
from completezza c
join public.ranking_config r on r.domain_id = c.domain_id;

revoke all on public.agency_punteggi from anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'brain_ro') then
    grant select on public.agency_punteggi to brain_ro;
  end if;
end $$;

-- ---- 3. Vista per il sito -------------------------------------------------------
create or replace view site.agency_punteggi as
select agency_id, tipo, skill_slug, servizi, completezza, punteggio
from public.agency_punteggi
where publish_status = 'publish';

revoke all on site.agency_punteggi from public, anon, authenticated;
grant select on site.agency_punteggi to site_reader;
